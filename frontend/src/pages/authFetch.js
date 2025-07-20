
export default async function authFetch(url, options = {}, retry = true) {

    const accessToken = localStorage.getItem("token")

    options.headers = {
        ...options.headers,
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
    };

    const res = await fetch(url, options)

    if (res.status === 401 || res.status === 403 && retry) {
        const tokenRes = await fetch('/token', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            credentials: 'include'
        });

        if (tokenRes.status === 200) {
            const tokenData = await tokenRes.json()
            localStorage.setItem("token", tokenData.accessToken)
            return authFetch(url, options, false)
        } 
        else {
            window.location.href = "/login"
        }
    }

    return res;
}
