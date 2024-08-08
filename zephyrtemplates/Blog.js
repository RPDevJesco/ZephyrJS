import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Blog extends ZephyrJS {
    static get observedAttributes() {
        return ['user'];
    }

    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            posts: [],
            user: 'Anonymous',
            newPostContent: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadPosts();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'user') {
            this.setState({ user: newValue });
        }
    }

    async loadPosts() {
        // In a real application, this would fetch posts from a server
        const dummyPosts = [
            { id: 1, author: 'John Doe', content: 'This is a short post, like a tweet!', likes: 5, comments: [], timestamp: new Date().toISOString() },
            { id: 2, author: 'Jane Smith', content: 'This is a longer post that would be more like a blog entry. It contains more detailed information and might span multiple paragraphs.', likes: 10, comments: [], timestamp: new Date().toISOString() }
        ];
        await this.setState({ posts: dummyPosts });
    }

    createPost(content) {
        const newPost = {
            id: this.state.posts.length + 1,
            author: this.state.user,
            content,
            likes: 0,
            comments: [],
            timestamp: new Date().toISOString()
        };
        this.setState({
            posts: [newPost, ...this.state.posts],
            newPostContent: ''
        });
    }

    likePost(postId) {
        const updatedPosts = this.state.posts.map(post =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
        );
        this.setState({ posts: updatedPosts });
    }

    addComment(postId, comment) {
        const updatedPosts = this.state.posts.map(post =>
            post.id === postId ? { ...post, comments: [...post.comments, { author: this.state.user, content: comment }] } : post
        );
        this.setState({ posts: updatedPosts });
    }

    evolvePost(postId, newContent) {
        const updatedPosts = this.state.posts.map(post =>
            post.id === postId ? { ...post, content: newContent, evolutions: [...(post.evolutions || []), { content: post.content, timestamp: new Date().toISOString() }] } : post
        );
        this.setState({ posts: updatedPosts });
    }

    render() {
        return `
            <div class="blog-container">
                <div class="new-post">
                    <textarea bind="{{newPostContent}}" placeholder="What's on your mind?"></textarea>
                    <button on="click:{{createPost}}">Post</button>
                </div>
                <div class="posts">
                    ${this.state.posts.map(post => this.renderPost(post)).join('')}
                </div>
            </div>
        `;
    }

    renderPost(post) {
        const isLongPost = post.content.length > 280;
        return `
            <div class="post ${isLongPost ? 'long-post' : 'short-post'}">
                <div class="post-header">
                    <span class="author">${post.author}</span>
                    <span class="timestamp">${new Date(post.timestamp).toLocaleString()}</span>
                </div>
                <div class="post-content">
                    ${isLongPost ? `<h2>${post.content.split(' ').slice(0, 5).join(' ')}...</h2>` : ''}
                    <p>${isLongPost ? post.content.slice(0, 280) + '... <span class="read-more" on="click:{{expandPost}}">Read more</span>' : post.content}</p>
                </div>
                <div class="post-actions">
                    <button on="click:{{likePost}}" data-post-id="${post.id}">👍 ${post.likes}</button>
                    <button on="click:{{showComments}}" data-post-id="${post.id}">💬 ${post.comments.length}</button>
                    <button on="click:{{evolvePost}}" data-post-id="${post.id}">🔄 Evolve</button>
                </div>
                <div class="comments" style="display: none;">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <span class="comment-author">${comment.author}:</span>
                            <span class="comment-content">${comment.content}</span>
                        </div>
                    `).join('')}
                    <div class="new-comment">
                        <input type="text" placeholder="Add a comment...">
                        <button on="click:{{addComment}}" data-post-id="${post.id}">Comment</button>
                    </div>
                </div>
            </div>
        `;
    }

    expandPost(event) {
        const postContent = event.target.closest('.post-content');
        const fullContent = this.state.posts.find(post => post.id === parseInt(event.target.closest('.post').dataset.postId)).content;
        postContent.innerHTML = `<p>${fullContent}</p>`;
    }

    showComments(event) {
        const commentsSection = event.target.closest('.post').querySelector('.comments');
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    }

    createPost() {
        if (this.state.newPostContent.trim()) {
            this.createPost(this.state.newPostContent);
        }
    }

    likePost(event) {
        const postId = parseInt(event.target.dataset.postId);
        this.likePost(postId);
    }

    addComment(event) {
        const postId = parseInt(event.target.dataset.postId);
        const commentInput = event.target.previousElementSibling;
        if (commentInput.value.trim()) {
            this.addComment(postId, commentInput.value);
            commentInput.value = '';
        }
    }

    evolvePost(event) {
        const postId = parseInt(event.target.dataset.postId);
        const post = this.state.posts.find(p => p.id === postId);
        const newContent = prompt('Evolve this post:', post.content);
        if (newContent && newContent !== post.content) {
            this.evolvePost(postId, newContent);
        }
    }
}

customElements.define('zephyr-blog', Blog);