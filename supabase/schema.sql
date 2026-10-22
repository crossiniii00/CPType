-- CP Type! Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: prompts
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('Beginner', 'Intermediate', 'Expert')),
    time_limit INTEGER DEFAULT 60,
    min_wpm INTEGER DEFAULT 40,
    min_accuracy INTEGER DEFAULT 95,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: attempts
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    wpm INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    errors INTEGER NOT NULL,
    attempt_number INTEGER NOT NULL,
    is_qualified BOOLEAN NOT NULL,
    prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: system_settings
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    min_wpm INTEGER DEFAULT 40,
    min_accuracy INTEGER DEFAULT 95,
    max_attempts INTEGER DEFAULT 3,
    time_limit INTEGER DEFAULT 60,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial settings
INSERT INTO system_settings (min_wpm, min_accuracy, max_attempts, time_limit) 
VALUES (40, 95, 3, 60);

-- Insert sample prompt
INSERT INTO prompts (title, content, difficulty, time_limit, min_wpm, min_accuracy)
VALUES (
    'Default Assessment #1', 
    'The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging code. High performance typing requires focus, rhythm, and precision. In a professional environment, speed is only as valuable as the accuracy that accompanies it.',
    'Intermediate',
    60,
    40,
    95
);
