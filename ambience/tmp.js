const fs = require('fs');
const { exec } = require('child_process');


/*
for (let i = 75; i < 76; i++) {
  let introFrame = 'tempFrames/frame-' + (1 + i) + '.bmp';
  let target = 'tempFrames/frame-' + (1 + i) + '.png';
  exec('convert ' + introFrame + ' ' + target, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log(err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log('worked for frame ' + i);
  });
}

for (let i = 0; i < 75; i++) {
  let introFrame = 'tempFrames/frame-' + (77 + i) + '.bmp';
  let maskFrame = 'burn-11/masks/frame-' + ('0' + i).substr(-2) + '.png';
  let target = 'tempFrames/frame-' + (77 + i) + '.png';
  exec('convert ' + introFrame + ' ' + maskFrame + ' -compose copy-opacity -composite ' + target, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log(err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log('worked for frame ' + i);
  });
}

for (let i = 0; i < 75; i++) {
  let introFrame = 'tempFrames/frame-' + (77 + i) + '.png';
  let maskFrame = 'burn-11/frame-' + ('0' + (1 + i)).substr(-2) + '.png';
  exec('composite -gravity center ' + maskFrame + ' ' + introFrame + ' ' + introFrame, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log(err);
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log('worked for frame ' + i);
  });
}
*/

let cmd = 'ffmpeg -i p1.MTS';
let filter = ' -filter_complex "';
for (var i = 0; i < 3; i++) {
  cmd += ' -i intro/frame-' + (i + 1) + '.png';
  filter += '[' + (i ? 'v' + i : i) + '][' + (i + 1) + '] overlay=0:0:enable=\'between(t,' + Math.round(i / 0.03) / 1000 + ',' + Math.round((i + 1) / 0.03) / 1000 + ')\'[v' + (i + 1) + ']; ';
}
console.log(cmd + filter.substr(0, filter.length - 2) + '" -map "[v' + i + ']" -map 0:a -c:a copy test.mp4');