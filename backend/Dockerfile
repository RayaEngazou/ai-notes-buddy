FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application
COPY . .

# Set environment variable for uvicorn to listen on all interfaces
ENV HOST 0.0.0.0
ENV PORT 8000

# Expose the port
EXPOSE 8000

# Start the app with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
