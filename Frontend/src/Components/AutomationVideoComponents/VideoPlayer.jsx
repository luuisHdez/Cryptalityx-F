import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { fetchS3Videos } from "../../APIAutomation/VideoAPI";
import BarLoader from "./BarLoader";


const VideoPlayer = ({ selectedVideo, setSelectedVideo }) => {
  const [videoList, setVideoList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await fetchS3Videos();
      if (data.videos?.length > 0) {
        setVideoList(data.videos);
        setSelectedVideo(data.videos[0]);
      }
    } catch (error) {
      console.error("❌ Error al cargar videos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleChange = (e) => {
    setSelectedVideo(e.target.value);
  };

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-black bg-opacity-60 flex items-center justify-center rounded">
          <BarLoader />
        </div>
      )}

      <div className={`flex items-center gap-2 ${loading ? "opacity-30 pointer-events-none" : ""}`}>
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
        <button
          onClick={loadVideos}
          className="px-2 py-1 text-xs border border-blue-500 rounded text-blue-400 hover:bg-blue-800 transition"
        >
          ↻
        </button>
      </div>

      {selectedVideo && (
        <div className="w-full aspect-video h-auto sm:h-[330px] mt-1">
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