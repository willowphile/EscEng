function attachShadow() {
    let shadow = document.getElementById('attachShadow');
    shadow.attachShadow({ mode: "open"});
    shadow.innerHTML = `<p>Boo!</p>`;
};

attachShadow()