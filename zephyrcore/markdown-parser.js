export function parseMarkdown(markdown) {
    let html = markdown;

    // Convert headers
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Convert bold text
    html = html.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
    html = html.replace(/\__(.*)\__/gim, '<b>$1</b>');

    // Convert italic text
    html = html.replace(/\*(.*)\*/gim, '<i>$1</i>');
    html = html.replace(/\_(.*)\_/gim, '<i>$1</i>');

    // Convert inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Convert code blocks
    html = html.replace(/```([^`]+)```/gims, '<pre><code>$1</code></pre>');

    // Convert new lines to <br>
    html = html.replace(/\n/gim, '<br>');

    return html.trim();
}