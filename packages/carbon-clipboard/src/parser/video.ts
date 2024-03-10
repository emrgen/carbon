export const parseVideo = async (item: ClipboardItem) => {
  const blob = await item.getType('video/mp4');
  const url = URL.createObjectURL(blob);
  const video = document.createElement('video');
  video.src = url;
  video.controls = true;
  video.autoplay = true;
  video.loop = true;
  video.muted = true;
  video.style.width = '100%';
  video.style.height = '100%';
  return video;
}
