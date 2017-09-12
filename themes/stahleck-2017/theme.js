(function () {
  let video = document.createElement('video');
  video.className = 'bgVideo';
  video.poster = 'themes/stahleck-2017/assets/poster.png';
  video.src = 'themes/stahleck-2017/assets/bg.mp4';
  video.autoplay = true;
  video.loop = true;
  document.body.appendChild(video);
}());