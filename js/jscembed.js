(function () {
    var done = [];
    
    function update() {
        var divs = document.querySelectorAll('div[class=project]');
        var i = divs.length;
        while (i--) {
            if (done.indexOf(divs[i]) === -1) {
                done.push(divs[i]);
                var project = jsc.createPlayer(divs[i].getAttribute('project'), divs[i].getAttribute('autoplay') === 'true');
                window.player = project[1];
                divs[i].innerHTML = '';
                divs[i].appendChild(project[0]);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', update, false);
    document.addEventListener("DOMNodeInserted", update, false);
    
    update();
}) ();