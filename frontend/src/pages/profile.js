import { Card, Form, Button, Container, Row, Col, Dropdown, ListGroup } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react'
import MyNavbar from '../components/mynavbar'
import authFetch from './authFetch.js'
import { FaPlus, FaMinus } from 'react-icons/fa'

const ALLERGEN_OPTIONS = ['Peanuts', 'Milk', 'Gluten', 'Soy', 'Eggs', 'Cashew nuts', 'Almonds']

export default function Profile() {

    const [user, setUser] = useState({ name: "", email: "" })
    const [allergens, setAllergens] = useState([])
    const [showDropdown, setShowDropdown] = useState(false)
    const isFirstRun = useRef(true)
    const previousAllergens = useRef([])

    async function getUserInfo() {

        const res = await authFetch('/user/info')
        const data = await res.json()
        setUser({ name: data.name, email: data.email })
        setAllergens(data.allergens || [])
    }

    useEffect(() => { getUserInfo(); }, [])

    async function updateAllergens() {
        if (
            JSON.stringify(previousAllergens.current.sort()) === JSON.stringify(allergens.sort())
        ) return

        previousAllergens.current = allergens
        await authFetch('/update_allergens', {
            method: 'POST',
            body: JSON.stringify({ Allergens: allergens })
        })
    }

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }
        updateAllergens()
    }, [allergens])

    function handleAddAllergen(item) {
        if (!allergens.includes(item)) {
            setAllergens([...allergens, item])
        }
        setShowDropdown(false)
    }

    function handleRemoveAllergen(item) {
        setAllergens(allergens.filter(a => a !== item))
    }

    return (
        <div>
            <MyNavbar />

            <Container className="d-flex justify-content-center align-items-center" style={{ height: '90vh' }}>
                <Card style={{ width: '320px', height: '550px', maxWidth: '450px', borderRadius: '15px', border: '1px solid black', overflowY: 'auto' }}>
                    <Card.Body>
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>

                        <Card className="mt-4" style={{ borderRadius: '4.9px', border: '1px solid #ccc' }}>
                            <Card.Header style={{ backgroundColor: '#d6b2d6', borderBottom: '1px solid #ccc' }}>
                                <strong>Select Your Allergens</strong>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group controlId="allergenSelect">
                                    <Form.Label>Hold Ctrl (or Cmd) to select multiple</Form.Label>
                                    <Form.Control
                                        as="select"
                                        multiple
                                        value={allergens}
                                        onChange={(e) => {
                                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                                            setAllergens(selected);
                                        }}
                                    >
                                        {ALLERGEN_OPTIONS.map(item => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
}
