(function () {
	const timerContainer = document.getElementById('timer');
  const video = document.createElement('video');
  video.src = '/themes/Stahleck-2017/assets/video/ambience.mp4';
  video.autoplay = true;
  video.loop = true;
  timerContainer.prepend(video);
  //timerContainer.innerHTML = '<video src="" autoplay loop></video>' + timerContainer.innerHTML;
}())