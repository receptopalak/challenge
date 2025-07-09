# Step 1: Define the base Python image
FROM python:3.10-slim

# Environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Step 2: Install necessary system libraries (including GDAL)
        # This is the most important part. We install GDAL into the Docker container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       libgdal-dev \
       gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Create and set the working directory
WORKDIR /app

# Step 4: Install Python dependencies
        # First, we copy and install only the requirements file to efficiently use Docker's layer cache.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Step 5: Copy all project files to the container
COPY . .

# Step 6: Specify the port the application will run on
EXPOSE 8000