function attachShadow() {
    let shadow = document.getElementById('attachShadow');
    let container = shadow.attachShadow({ mode: "open"});

    let b1 = document.createElement('button');
    b1.setAttribute("id", "1");
    b1.setAttribute("type", "button");
    b1.setAttribute("style", "height: 50px; color: #fff; background-color: rgba(222, 40, 100, 1); border-color: rgba(222, 40, 100, 1);");
    b1.innerHTML = "Button"

    container.appendChild(b1);
};

attachShadow()