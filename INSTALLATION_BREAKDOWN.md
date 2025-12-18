# Installation Data Usage Breakdown

## What's Being Downloaded (3GB Total)

### 1. Frontend Dependencies (~400-500 MB)
- **React** and related packages: ~50 MB
- **Vite** build tool: ~30 MB
- **Tailwind CSS**: ~10 MB
- **React Router, React Query, Zustand**: ~20 MB
- **Socket.IO Client**: ~5 MB
- **Axios**: ~2 MB
- **All node_modules**: ~300-400 MB (includes all transitive dependencies)

### 2. Backend Dependencies (~200-300 MB)
- **Express**: ~5 MB
- **MongoDB/Mongoose**: ~50 MB
- **Socket.IO**: ~10 MB
- **JWT, Passport, OAuth**: ~20 MB
- **Winston, Joi, Helmet**: ~15 MB
- **All node_modules**: ~100-200 MB

### 3. ML Service Dependencies (~2-2.5 GB) ⚠️ LARGEST
- **TensorFlow**: ~500-800 MB (deep learning framework)
- **PyTorch**: ~700-1000 MB (deep learning framework)
- **transformers**: ~200-300 MB (Hugging Face NLP models)
- **scikit-learn**: ~50-100 MB
- **pandas**: ~50-100 MB
- **numpy**: ~20-50 MB
- **FastAPI, uvicorn**: ~10-20 MB
- **All dependencies**: ~2-2.5 GB total

## Why ML Libraries Are So Large

1. **TensorFlow & PyTorch**: Include pre-compiled binaries for CPU/GPU operations
2. **transformers**: Includes model weights and tokenizers
3. **Optimized binaries**: Compiled for performance, not size

## Options to Reduce Size

### Option 1: Install Only Essential Packages (Recommended for Development)
Skip heavy ML libraries if you're not using them immediately:
- Remove TensorFlow/PyTorch if not needed yet
- Install them later when actually needed

### Option 2: Use CPU-Only Versions
- TensorFlow CPU-only: ~200 MB (vs 500-800 MB)
- PyTorch CPU-only: ~300 MB (vs 700-1000 MB)

### Option 3: Install Incrementally
- Install FastAPI first (small)
- Add ML libraries only when needed

