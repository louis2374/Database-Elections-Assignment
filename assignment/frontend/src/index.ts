// frontend/src/index.ts
document.addEventListener('DOMContentLoaded', () =>
{
    const messageElement = document.createElement('p');
    messageElement.textContent = 'Welcome to my simple TypeScript app!';
    document.body.appendChild(messageElement);

    // Example of making an API call to the backend
    fetch('http://localhost:3000/test?msg=Hello%20from%20frontend')
        .then(response => response.json())
        .then(data =>
        {
            const backendMessageElement = document.createElement('p');
            backendMessageElement.textContent = `Response from backend: ${data.message}`;
            document.body.appendChild(backendMessageElement);
        })
        .catch(error => console.error('Error fetching data:', error));
});
