# Use an official Python runtime as the parent image
FROM python:3.9-slim

RUN apt-get update --fix-missing && apt-get install -y --fix-missing \
    build-essential \
    libpq-dev \
    libpq5 \
    gcc
    
ENV HNSWLIB_NO_NATIVE=1

# Install PostgreSQL development files
RUN apt-get update && apt-get install -y libpq-dev gcc && apt-get clean

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY ./app .
COPY ./requirements.txt /app/requirements.txt 
COPY ./.env /app/.env

RUN pip install --upgrade pip 

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Clean up
RUN apt-get purge -y libpq-dev gcc && apt-get autoremove -y

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV NAME World

# Run the application when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]

