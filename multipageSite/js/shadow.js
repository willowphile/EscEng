const sheet = new CSSStyleSheet();
const css =`
    button {
        height: 50px;
        color: #fff;
        padding-right: 1rem;
        padding-left: 1rem; 
        background-color: rgba(222, 40, 100, 1);
        border-radius: 12px;
        border: none;
        margin: 20px;
    }
    

`
sheet.replaceSync(css);


function attachShadow() {
    let shadow = document.getElementById('attachShadow');
    let container = shadow.attachShadow({ mode: "open"});

    let b1 = document.createElement('button');
    b1.setAttribute("id", "1");
    b1.setAttribute("type", "button");
    b1.innerHTML = "Button"

    container.adoptedStyleSheets = [sheet]
    container.appendChild(b1);
};



attachShadow()
