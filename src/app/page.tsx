"use client";
import Image from "next/image";
import { useState } from "react";

interface Movie {
  title: string;
  genres: string[];
  rating: number;
  similarity_score: number;
  poster_url: string;
  summary?: string;
}

const MovieImage = ({ src, alt }: { src: string; alt: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-gray-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM8 15h8v2H8zm0-4h8v2H8zm0-4h8v2H8z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-300 hover:scale-105"
      onError={() => setError(true)}
      unoptimized
    />
  );
};

export default function Home() {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId] = useState(
    `user_${Math.random().toString(36).substr(2, 9)}`
  );
  const apiUrl = process.env.NEXT_PUBLIC_FLASK_API;
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/search?query=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }
      const movies = await response.json();
      setSearchResults(movies);
    } catch (error) {
      console.error("Erreur:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectMovie = async (movie: string) => {
    setSearchQuery(movie);
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/movie_details?movie=${encodeURIComponent(movie)}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des détails du film");
      }
      const data = await response.json();
      setSelectedMovie(data.movie);
      getRecommendations(movie);
    } catch (error) {
      console.error("Erreur:", error);
      setSelectedMovie(null);
    }
  };

  const getRecommendations = async (movieTitle: string) => {
    setSearchResults([]);
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/recommend?movie=${encodeURIComponent(
          movieTitle
        )}&user_id=${currentUserId}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des recommandations");
      }
      const data = await response.json();

      if (data.error) {
        console.error("Erreur API:", data.error);
        return;
      }

      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Erreur:", error);
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (movieTitle: string, liked: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUserId,
          movie_title: movieTitle,
          liked: liked,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du feedback");
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSelectMovie(searchResults[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec logo */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg
              className="w-10 h-10 text-[#E50914]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#E50914] to-[#FF6B6B] bg-clip-text text-transparent">
              CineMatch
            </h1>
          </div>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Découvrez des films qui vous correspondent grâce à notre système de
            recommandation intelligent alimenté par l'IA
          </p>
        </div>

        {/* Section recherche */}
        <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl mb-12 border border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              className="w-full px-6 py-4 pr-12 rounded-full bg-gray-900/50 border-2 border-gray-700 
                       text-white placeholder-gray-400 focus:border-[#E50914] focus:ring-2 
                       focus:ring-[#E50914]/25 transition-all"
              placeholder="🔍 Rechercher un film..."
              onChange={(e) => handleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 
                         hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E50914] border-t-transparent mx-auto"></div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-700">
              {searchResults.map((movie, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectMovie(movie)}
                  className="w-full text-left px-6 py-4 hover:bg-[#E50914] text-gray-300 
                           hover:text-white transition-colors duration-200"
                >
                  <span className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5v9z" />
                    </svg>
                    {movie}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section film sélectionné */}
        {selectedMovie && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Film Sélectionné
            </h2>
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                <div className="relative h-[450px]">
                  <MovieImage
                    src={selectedMovie.poster_url}
                    alt={selectedMovie.title}
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-3xl font-bold mb-4">
                    {selectedMovie.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {selectedMovie.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="bg-[#E50914]/20 text-[#E50914] px-3 py-1 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="mb-6">
                    <span className="bg-[#E50914] text-white px-4 py-2 rounded-full text-lg font-medium">
                      ★ {(selectedMovie.rating * 10).toFixed(1)}/10
                    </span>
                  </div>
                  {selectedMovie.summary && (
                    <p className="text-gray-300 mb-8 leading-relaxed">
                      {selectedMovie.summary}
                    </p>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={() => sendFeedback(selectedMovie.title, true)}
                      className="flex-1 bg-[#E50914] text-white py-3 rounded-full 
                               hover:bg-[#F40D12] hover:-translate-y-1 transition-all duration-200"
                    >
                      J'aime
                    </button>
                    <button
                      onClick={() => sendFeedback(selectedMovie.title, false)}
                      className="flex-1 bg-gray-700 text-white py-3 rounded-full 
                               hover:bg-gray-600 hover:-translate-y-1 transition-all duration-200"
                    >
                      Je n'aime pas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section recommandations */}
        {recommendations.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-8 text-center">
              Films Recommandés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendations.map((movie, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl 
                           border border-gray-700 overflow-hidden hover:-translate-y-2 
                           transition-all duration-300"
                >
                  <div className="relative pb-[150%] overflow-hidden">
                    <MovieImage src={movie.poster_url} alt={movie.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <h5 className="text-xl font-bold mb-3">{movie.title}</h5>
                    <div className="mb-3 text-gray-400 text-sm">
                      {movie.genres.join(" • ")}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="bg-[#E50914]/20 text-[#E50914] px-3 py-1 rounded-full text-sm font-medium">
                        ★ {(movie.rating * 10).toFixed(1)}/10
                      </span>
                      <span className="bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {Math.round(movie.similarity_score * 100)}% de match
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => sendFeedback(movie.title, true)}
                        className="flex-1 bg-[#E50914] text-white py-3 rounded-full 
                                 hover:bg-[#F40D12] hover:-translate-y-1 transition-all duration-200"
                      >
                        J'aime
                      </button>
                      <button
                        onClick={() => sendFeedback(movie.title, false)}
                        className="flex-1 bg-gray-700 text-white py-3 rounded-full 
                                 hover:bg-gray-600 hover:-translate-y-1 transition-all duration-200"
                      >
                        Je n'aime pas
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
