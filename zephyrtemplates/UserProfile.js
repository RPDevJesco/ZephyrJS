import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class UserProfile extends ZephyrJS {
    static get renderBlocking() {
        return true;
    }

    async performRenderBlockingTasks() {
        // Fetch user data before rendering
        try {
            const response = await fetch('https://dummyjson.com/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'emilys',
                    password: 'emilyspass',
                    expiresInMins: 30,
                })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const userData = await response.json();
            this.setState({
                name: `${userData.firstName} ${userData.lastName}`,
                email: userData.email,
                phone: userData.phone || 'Not provided', // Dummy JSON does not provide phone, set a default
                image: userData.image
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
            this.setState({
                name: 'Error fetching user data',
                email: '',
                phone: '',
                image: ''
            });
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }

    componentDidMount() {

    }

    updateBindings() {
        Object.keys(this.state).forEach(key => {
            const elements = this.shadowRoot.querySelectorAll(`[data-bind=${key}]`);
            elements.forEach(element => {
                if (element.tagName === 'IMG' && key === 'image') {
                    element.src = this.state[key];
                } else {
                    element.textContent = this.state[key];
                }
            });
        });
    }
}

UserProfile.isCoreTemplate = true;
defineCustomElement('user-profile', UserProfile);