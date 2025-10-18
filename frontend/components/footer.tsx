export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-black dark:from-gray-900 dark:via-black dark:to-gray-800 text-white py-6 relative overflow-hidden">
      <div className="absolute inset-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/10 rounded-full float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <p className="neon-text text-lg font-semibold mb-2">&copy; 2025 Somnia AI Gig Economy</p>
        <p className="text-sm text-gray-300 mb-4">Built for the hackathon with cutting-edge blockchain technology</p>
        <a
          href="https://hackathon.example.com"
          className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Hackathon Site
        </a>
      </div>
    </footer>
  );
}
