
export default async function authFetch(url, options = {}, retry = true) {

    const accessToken = sessionStorage.getItem("accessToken")
    const isFormData = options.body instanceof FormData

    options.headers = {
        ...options.headers,
        ...(!isFormData && { "Content-Type": "application/json" }),
        ...(accessToken && { "Authorization": `Bearer ${accessToken}` }),
    };

    options.credentials = options.credentials || 'include'

    const res = await fetch(url, options)

    if ((res.status === 401 || res.status === 403) && retry) {
        const tokenRes = await fetch('/auth/token', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            credentials: 'include'
        });

        if (tokenRes.status === 200) {
            const tokenData = await tokenRes.json()
            sessionStorage.setItem("accessToken", tokenData.accessToken)
            return authFetch(url, options, false)
        } 
        else {
            sessionStorage.removeItem("accessToken")
            window.location.href = "/login"
        }
    }

    return res;
}

