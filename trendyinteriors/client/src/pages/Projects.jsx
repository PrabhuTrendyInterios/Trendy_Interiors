import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaLongArrowAltRight } from 'react-icons/fa';
import ProjectSlideshow from '../components/ProjectSlideshow';
import ScrollVideoBackground from '../components/ScrollVideoBackground';
import { publicGet, normalizeProjectForDisplay, getProjectCover } from '../utils/publicApi';
import './Projects.css';

const DEFAULT_CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'art-craft', label: 'Art & Craft' },
];

const buildCategoriesFromProjects = (projects) => {
  const unique = [...new Set(projects.map((p) => p.category).filter(Boolean))];
  if (unique.length === 0) return DEFAULT_CATEGORIES;

  return [
    { id: 'all', label: 'All Projects' },
    ...unique.map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' '),
    })),
  ];
};

const Projects = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [allProjects, setAllProjects] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [slideshowOpen, setSlideshowOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await publicGet('/api/projects');
        if (data.success && Array.isArray(data.data)) {
          const normalized = data.data.map(normalizeProjectForDisplay);
          setAllProjects(normalized);
          setCategories(buildCategoriesFromProjects(normalized));
        } else {
          setAllProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setAllProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    setIsAnimating(true);
    const filtered =
      activeCategory === 'all'
        ? allProjects
        : allProjects.filter((p) => p.category === activeCategory);

    const timer = setTimeout(() => {
      setVisibleProjects(filtered);
      setIsAnimating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, allProjects]);

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setSlideshowOpen(true);
  };

  const handleCloseSlidshow = () => {
    setSlideshowOpen(false);
    setTimeout(() => setSelectedProject(null), 300);
  };

  return (
    <div className="projects-page">
      <ScrollVideoBackground imageSrc="/images/bedroom-image.png" videoSrc="/video/bedroom-video.mp4" />

      <section className="projects-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Our Projects</h1>
          <p className="hero-subtitle">Crafted spaces that define excellence &amp; luxury</p>
          <div className="breadcrumbs">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <span className="current">Projects</span>
          </div>
        </div>
      </section>

      <section className="projects-content">
        <div className="container">
          <div className="filter-container">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="empty-projects">
              <p>Loading projects...</p>
            </div>
          ) : (
            <div className={`projects-grid ${isAnimating ? 'fade-out' : 'fade-in'}`}>
              {visibleProjects.map((project) => (
                <div key={project._id} className="project-card-premium">
                  <div className="project-image-wrapper">
                    <img src={getProjectCover(project)} alt={project.title} />
                    <div className="project-overlay">
                      <div className="overlay-content">
                        <span className="project-badge">{project.category}</span>
                        <h3>{project.title}</h3>
                        <p className="project-app-desc">{project.description}</p>
                        <button className="view-project-btn" onClick={() => handleViewProject(project)}>
                          View Project <FaLongArrowAltRight />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="project-meta-bar">
                    <div className="meta-item">
                      <FaMapMarkerAlt /> {project.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && visibleProjects.length === 0 && !isAnimating && (
            <div className="empty-projects">
              <p>No projects found in this category.</p>
            </div>
          )}
        </div>
      </section>

      <section className="projects-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Have a project in mind?</h2>
            <p>Let's collaborate to create something extraordinary for your space.</p>
            <Link to="/estimator" style={{ textDecoration: 'none' }}>
              <button className="btn-cta-gold">Quote Interior Yourself</button>
            </Link>
          </div>
        </div>
      </section>

      <ProjectSlideshow isOpen={slideshowOpen} project={selectedProject} onClose={handleCloseSlidshow} />
    </div>
  );
};

export default Projects;
