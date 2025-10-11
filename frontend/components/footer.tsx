export default function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-4">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2025 Somnia AI Gig Economy. Built for the hackathon.</p>
        <a
          href="https://hackathon.example.com"
          className="text-blue-400 hover:text-blue-300 transition-colors duration-300 hover:text-shadow-glow"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Hackathon Site
        </a>
      </div>
    </footer>
  );
}
