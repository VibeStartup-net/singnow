const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface VideoResult {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
}

export const searchVideos = async (query: string): Promise<VideoResult[]> => {
    if (!query) return [];

    try {
        // Step 1: Search for videos
        const searchResponse = await fetch(
            `${BASE_URL}/search?part=snippet&maxResults=25&q=${encodeURIComponent(
                query + " karaoke"
            )}&type=video&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
            console.error("YouTube API Error", await searchResponse.text());
            return [];
        }

        const searchData = await searchResponse.json();
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

        if (!videoIds) return [];

        // Step 2: Get video details including embeddable status
        const videosResponse = await fetch(
            `${BASE_URL}/videos?part=snippet,status&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );

        if (!videosResponse.ok) {
            console.error("YouTube Videos API Error", await videosResponse.text());
            return [];
        }

        const videosData = await videosResponse.json();

        // Filter for embeddable videos only
        return videosData.items
            .filter((item: any) => item.status?.embeddable === true)
            .map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                channelTitle: item.snippet.channelTitle,
            }));
    } catch (error) {
        console.error("Error searching YouTube videos:", error);
        return [];
    }
};
