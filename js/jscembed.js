document.addEventListener('DOMContentLoaded', function () {
	var divs = document.querySelectorAll('div[project]');
	var i = divs.length;
	while (i--) {
	var project = jsc.createPlayer(divs[i].getAttribute('project'), false);
		window.player = project[1];
		divs[i].innerHTML = '';
		divs[i].appendChild(project[0]);
	}
});