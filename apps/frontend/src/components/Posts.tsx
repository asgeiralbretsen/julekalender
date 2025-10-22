import { useEffect, useState } from 'react'
import { client } from '../lib/sanity'

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  image?: {
    asset: {
      _ref: string
    }
  }
}

const POSTS_QUERY = `*[_type == "post"] | order(publishedAt desc) [0...5] {
  _id,
  title,
  slug,
  publishedAt,
  image
}`

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await client.fetch(POSTS_QUERY)
        setPosts(data)
      } catch (err) {
        setError('Failed to fetch posts')
        console.error('Error fetching posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-christmas-lg p-6 border-2 border-yellow-400/20">
        <h2 className="text-xl font-semibold mb-4 text-yellow-300">Latest Posts</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200/20 rounded mb-2"></div>
          <div className="h-4 bg-gray-200/20 rounded mb-2"></div>
          <div className="h-4 bg-gray-200/20 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-christmas-lg p-6 border-2 border-yellow-400/20">
        <h2 className="text-xl font-semibold mb-4 text-yellow-300">Latest Posts</h2>
        <div className="text-red-300 bg-red-800/20 rounded-lg p-3">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-christmas-lg p-6 border-2 border-yellow-400/20">
      <h2 className="text-xl font-semibold mb-4 text-yellow-300 flex items-center space-x-2">
        <span>🎄</span>
        <span>Latest Posts</span>
      </h2>
      {posts.length === 0 ? (
        <p className="text-red-100">No posts available</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post._id} className="border-b border-yellow-400/20 pb-3 last:border-b-0 hover:bg-white/5 transition-colors rounded-lg px-2 py-1">
              <h3 className="font-medium text-white hover:text-yellow-300 cursor-pointer transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-red-200">
                {new Date(post.publishedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
