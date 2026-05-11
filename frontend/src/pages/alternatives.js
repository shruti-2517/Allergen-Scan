import { Container, Row, Col, Card, Spinner, Button } from 'react-bootstrap'
import MyNavbar from '../components/mynavbar'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import authFetch from './authFetch'
import { FiArrowLeft } from 'react-icons/fi'
import '../styles/alternatives.css'

export default function Alternatives() {
    const { barcode } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchAlternatives() {
            setLoading(true)
            try {
                const res = await authFetch(`/alternatives/${barcode}`)
                if (!res.ok) {
                    const err = await res.json()
                    setError(err.error || 'Failed to load alternatives')
                    return
                }
                const json = await res.json()
                setData(json)
            } catch (e) {
                setError('Something went wrong. Please try again.')
            } finally {
                setLoading(false)
            }
        }
        fetchAlternatives()
    }, [barcode])

    return (
        <div className="alt-container">
            <MyNavbar />
            <Container className="alt-content">
                <button className="back-link" onClick={() => navigate(-1)}>
                    <FiArrowLeft /> Back
                </button>

                <div className="alt-header">
                    <h2 className="alt-title">Alternative Products</h2>
                    {data?.category && (
                        <p className="alt-subtitle">
                            Products in <span className="category-tag">{data.category.replace('en:', '')}</span> compared with your allergen profile
                        </p>
                    )}
                </div>

                {loading && (
                    <div className="alt-loading">
                        <Spinner animation="border" variant="primary" />
                        <p>Searching for safe alternatives...</p>
                    </div>
                )}

                {error && (
                    <div className="alt-empty">
                        <span className="alt-empty-icon">⚠️</span>
                        <p>{error}</p>
                        <Button className="btn-back-home" onClick={() => navigate('/home')}>Back to Home</Button>
                    </div>
                )}

                {!loading && !error && data?.alternatives?.length === 0 && (
                    <NoAlternativesSection barcode={barcode} navigate={navigate} />
                )}

                {!loading && !error && data?.alternatives?.length > 0 && (
                    <Row className="g-4">
                        {data.alternatives.map((product, i) => (
                            <Col key={i} xs={12} sm={6} lg={4}>
                                <Card className="alt-card" role="button" onClick={() => navigate(`/alternative-detail/${product.barcode}`)}>                                    <div className="alt-image-container">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.product_name} className="alt-image" />
                                        ) : (
                                            <div className="alt-image-placeholder">🛒</div>
                                        )}
                                    </div>
                                    <Card.Body className="alt-card-body">
                                        <h5 className="alt-product-name">{product.product_name}</h5>
                                        <p className="alt-barcode"><code>{product.barcode}</code></p>
                                        <div className={`alt-safe-badge ${product.uncertain ? 'uncertain' : 'safe'}`}>
                                            {product.uncertain ? '? Safety Uncertain' : '✓ Safe for You'}
                                        </div>
                                        {product.hasTraceWarning && product.traceAllergens?.length > 0 && (
                                            <p className="alt-warning-note">
                                                Trace warning for your allergens: {product.traceAllergens.join(', ')}
                                            </p>
                                        )}
                                        {!product.hasTraceWarning && product.uncertainIngredients?.length > 0 && (
                                            <p className="alt-warning-note">
                                                Contains vague ingredients that may hide allergens relevant to your profile.
                                            </p>
                                        )}
                                        <p className="alt-ingredients-count">{product.ingredients_count} ingredients</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    )
}

function NoAlternativesSection({ barcode, navigate }) {
    const [recipeState, setRecipeState] = useState('idle') // idle | loading | success | error
    const [recipe, setRecipe] = useState(null)
    const [recipeError, setRecipeError] = useState(null)

    const handleGenerateRecipe = async () => {
        setRecipeState('loading')
        setRecipeError(null)
        try {
            const res = await authFetch(`/generate-recipe/${barcode}`)
            const json = await res.json()
            if (!res.ok) {
                setRecipeError(json.error || 'Failed to generate recipe.')
                setRecipeState('error')
                return
            }
            setRecipe(json)
            setRecipeState('success')
        } catch (e) {
            setRecipeError('Something went wrong. Please try again.')
            setRecipeState('error')
        }
    }

    if (recipeState === 'success' && recipe) {
        return <RecipeCard recipe={recipe} onBack={() => setRecipeState('idle')} />
    }

    return (
        <div className="alt-empty">
            <span className="alt-empty-icon">🔍</span>
            <p>No safe alternatives found in this category.</p>

            {recipeState === 'idle' && (
                <div className="recipe-cta">
                    <p className="recipe-cta-text">
                        Can't find a safe product? Let AI craft a <strong>personalized allergen-free recipe</strong> just for you.
                    </p>
                    <button className="btn-generate-recipe" onClick={handleGenerateRecipe}>
                        ✨ Generate AI Recipe
                    </button>
                </div>
            )}

            {recipeState === 'loading' && (
                <div className="recipe-generating">
                    <div className="recipe-generating-spinner">
                        <Spinner animation="border" style={{ color: '#7c5cff', width: '2.5rem', height: '2.5rem' }} />
                    </div>
                    <p className="recipe-generating-text">Crafting your personalized recipe...</p>
                    <p className="recipe-generating-sub">AI is considering your allergen profile</p>
                </div>
            )}

            {recipeState === 'error' && (
                <div className="recipe-error-block">
                    <p className="recipe-error-msg">⚠️ {recipeError}</p>
                    <button className="btn-generate-recipe" onClick={handleGenerateRecipe}>
                        Try Again
                    </button>
                </div>
            )}

            {recipeState === 'idle' && (
                <Button className="btn-back-home mt-3" onClick={() => navigate('/home')}>Back to Home</Button>
            )}
        </div>
    )
}

function RecipeCard({ recipe, onBack }) {
    const r = recipe.recipe

    return (
        <div className="recipe-card-wrapper">
            <div className="recipe-ai-badge">✨ AI Generated Recipe</div>

            <div className="recipe-card">
                <div className="recipe-card-header">
                    <h2 className="recipe-name">{r.recipe_name}</h2>
                    <p className="recipe-description">{r.description}</p>

                    <div className="recipe-meta">
                        {r.prep_time && (
                            <div className="recipe-meta-item">
                                <span className="recipe-meta-icon">⏱️</span>
                                <div>
                                    <div className="recipe-meta-label">Prep</div>
                                    <div className="recipe-meta-value">{r.prep_time}</div>
                                </div>
                            </div>
                        )}
                        {r.cook_time && (
                            <div className="recipe-meta-item">
                                <span className="recipe-meta-icon">🍳</span>
                                <div>
                                    <div className="recipe-meta-label">Cook</div>
                                    <div className="recipe-meta-value">{r.cook_time}</div>
                                </div>
                            </div>
                        )}
                        {r.servings && (
                            <div className="recipe-meta-item">
                                <span className="recipe-meta-icon">🍽️</span>
                                <div>
                                    <div className="recipe-meta-label">Serves</div>
                                    <div className="recipe-meta-value">{r.servings}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="recipe-body">
                    <div className="recipe-section">
                        <h4 className="recipe-section-title">🛒 Ingredients</h4>
                        <ul className="recipe-ingredients-list">
                            {r.ingredients.map((ing, i) => (
                                <li key={i} className="recipe-ingredient-item">
                                    <span className="recipe-ingredient-dot" />
                                    {ing}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="recipe-section">
                        <h4 className="recipe-section-title">📋 Instructions</h4>
                        <ol className="recipe-steps-list">
                            {r.steps.map((step, i) => (
                                <li key={i} className="recipe-step-item">
                                    <span className="recipe-step-num">{i + 1}</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {r.allergen_note && (
                        <div className="recipe-allergen-note">
                            <span className="recipe-allergen-icon">🛡️</span>
                            <p>{r.allergen_note}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="recipe-actions">
                <button className="btn-regenerate" onClick={onBack}>
                    ↩ Try Different Recipe
                </button>
            </div>
        </div>
    )
}
