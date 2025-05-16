import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { fetchS3Videos } from "../../APIAutomation/VideoAPI";

const VideoPlayer = () => {
  const [videoList, setVideoList] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchS3Videos();
        if (data.videos?.length > 0) {
          setVideoList(data.videos);
          setSelectedVideo(data.videos[0]);
        }
      } catch (error) {
        console.error("❌ Error al cargar videos:", error.message);
      }
    };

    loadVideos();
  }, []);

  const handleChange = (e) => {
    setSelectedVideo(e.target.value);
  };

  return (
    <div className="w-full space-y-2 text-xs">
      <select
        className="w-full p-2 bg-neutral-800 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={selectedVideo || ""}
        onChange={handleChange}
      >
        {videoList.map((url, idx) => (
          <option key={idx} value={url}>
            Video {idx + 1}
          </option>
        ))}
      </select>

      {selectedVideo && (
        <div className="w-full h-72">
          <ReactPlayer
            url={selectedVideo}
            controls
            width="100%"
            height="100%"
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
