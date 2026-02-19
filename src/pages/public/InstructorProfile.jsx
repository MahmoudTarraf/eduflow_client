import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Linkedin, 
  Github, 
  Twitter, 
  Globe,
  Mail,
  ArrowLeft,
  Star,
  Video,
  Play
} from 'lucide-react';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';

const InstructorProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    fetchInstructorProfile();
  }, [id]);

  const fetchInstructorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get(`/api/instructors/${id}`);
      const instructorData = res.data.instructor;
      setInstructor(instructorData);
      setCourses(instructorData.courses || []);
      
      // Fetch introduction video
      fetchInstructorVideo(id);
    } catch (error) {
      console.error('Error fetching instructor profile:', error);
      setError(error.response?.data?.message || 'Failed to load instructor profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorVideo = async (instructorId) => {
    try {
      setLoadingVideo(true);
      const response = await axios.get(`/api/instructor/${instructorId}/video-info`);
      if (response.data.success) {
        setVideoInfo(response.data.data);
      }
    } catch (error) {
      console.log('No introduction video available for this instructor');
      setVideoInfo(null);
    } finally {
      setLoadingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/instructors')}
            className="btn-primary"
          >
            Back to Instructors
          </button>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Instructor not found</p>
          <button
            onClick={() => navigate('/instructors')}
            className="btn-primary"
          >
            Back to Instructors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/instructors')}
            className="flex items-center text-white mb-6 hover:text-indigo-200 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('backToInstructors')}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-lg">
              {instructor.avatar ? (
                <img
                  src={instructor.avatar}
                  alt={instructor.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-indigo-600">
                  {instructor.name?.charAt(0)?.toUpperCase() || 'I'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">
                {instructor.name}
              </h1>
              {instructor.bio && (
                <p className="text-xl text-indigo-100 mb-4">
                  {instructor.bio}
                </p>
              )}
              
              {/* Social Links */}
              {instructor.socialLinks && Object.values(instructor.socialLinks).some(link => link) && (
                <div className="flex justify-center md:justify-start gap-4 mt-4">
                  {instructor.socialLinks.linkedin && (
                    <a
                      href={instructor.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-indigo-200 transition"
                    >
                      <Linkedin className="w-6 h-6" />
                    </a>
                  )}
                  {instructor.socialLinks.github && (
                    <a
                      href={instructor.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-indigo-200 transition"
                    >
                      <Github className="w-6 h-6" />
                    </a>
                  )}
                  {instructor.socialLinks.twitter && (
                    <a
                      href={instructor.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-indigo-200 transition"
                    >
                      <Twitter className="w-6 h-6" />
                    </a>
                  )}
                  {instructor.socialLinks.website && (
                    <a
                      href={instructor.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-indigo-200 transition"
                    >
                      <Globe className="w-6 h-6" />
                    </a>
                  )}
                  {instructor.email && (
                    <a
                      href={`mailto:${instructor.email}`}
                      className="text-white hover:text-indigo-200 transition"
                    >
                      <Mail className="w-6 h-6" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
              <BookOpen className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {instructor.courseCount || 0}
            </p>
            <p className="text-gray-600 dark:text-gray-400">{t('coursesCount')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {instructor.studentCount || 0}
            </p>
            <p className="text-gray-600 dark:text-gray-400">{t('studentsCount')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
              <Star className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {instructor.averageRating > 0 ? instructor.averageRating.toFixed(1) : 'N/A'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Rating {instructor.ratingCount > 0 && `(${instructor.ratingCount} courses)`}
            </p>
          </div>
        </motion.div>

        {(instructor.aboutMeHtml || instructor.aboutMe) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              About Me
            </h2>
            <div
              className="text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-200 space-y-2"
              dangerouslySetInnerHTML={{ __html: instructor.aboutMeHtml || instructor.aboutMe }}
            />
          </motion.div>
        )}

        {/* Expertise Section */}
        {instructor.expertise && instructor.expertise.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Areas of Expertise
            </h2>
            <div className="flex flex-wrap gap-3">
              {instructor.expertise.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Introduction Video Section */}
        {videoInfo?.hasVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                <Video className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Introduction Video
              </h2>
            </div>
            <InstructorVideoPlayer videoUrl={videoInfo.videoUrl} />
          </motion.div>
        )}

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('coursesBy')} {instructor.name}
          </h2>
          
          {courses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('noCoursesAvailableYet')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  {/* Course Image */}
                  {course.image && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.name}
                    </h3>
                    
                    {course.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    
                    {/* Course Level */}
                    {course.level && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {course.level}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Video Player Component for Instructor Introduction
const InstructorVideoPlayer = ({ videoUrl }) => {
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const [audioContext, setAudioContext] = React.useState(null);
  const [analyser, setAnalyser] = React.useState(null);
  
  const getVideoType = (url) => {
    if (!url) return 'none';
    
    // Check if it's a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    
    // Check if it's a real Cloudinary URL
    if (url.includes('res.cloudinary.com') && url.includes('/video/')) {
      return 'cloudinary';
    }
    
    // Everything else is local
    return 'local';
  };
  
  // Initialize audio context and analyser for sound visualization
  React.useEffect(() => {
    if (!videoRef.current || getVideoType(videoUrl) === 'youtube') return;
    
    const initAudioContext = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        
        const source = ctx.createMediaElementSource(videoRef.current);
        source.connect(analyserNode);
        analyserNode.connect(ctx.destination);
        
        setAudioContext(ctx);
        setAnalyser(analyserNode);
        
        // Start visualization
        visualize(analyserNode);
      } catch (err) {
        console.log('Audio visualization not supported:', err);
      }
    };
    
    videoRef.current?.addEventListener('play', initAudioContext, { once: true });
    
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [videoUrl]);
  
  const visualize = (analyserNode) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      requestAnimationFrame(draw);
      
      analyserNode.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
  };

  const getYouTubeEmbedUrl = (url) => {
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
      return url; // Already in embed format
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const getVideoSrc = () => {
    // If it's a relative path, prepend base URL
    if (!videoUrl.startsWith('http')) {
      return `${axios.defaults.baseURL || 'http://localhost:5000'}${videoUrl}`;
    }
    return videoUrl;
  };

  const videoType = getVideoType(videoUrl);
  const videoSrc = getVideoSrc();

  if (videoType === 'youtube') {
    return (
      <CustomYouTubePlayer
        youtubeVideoId={null}
        embedUrl={videoUrl}
        title="Instructor Introduction Video"
      />
    );
  }

  // For local and Cloudinary videos
  return (
    <div className="relative rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        controls
        className="w-full"
        style={{ maxHeight: '600px' }}
        controlsList="nodownload"
        crossOrigin="anonymous"
      >
        <source src={videoSrc} type="video/mp4" />
        <source src={videoSrc} type="video/webm" />
        <source src={videoSrc} type="video/quicktime" />
        Your browser does not support the video tag.
      </video>
      {/* Sound Meter Visualization */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <canvas
          ref={canvasRef}
          width="800"
          height="64"
          className="w-full h-full opacity-75"
        />
      </div>
    </div>
  );
};

export default InstructorProfile;
