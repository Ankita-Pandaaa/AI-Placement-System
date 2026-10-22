from flask import Flask, request, jsonify
from question_templates import templates
from skills_list import known_skills
from skill_topics import skill_topics
from topic_keywords import topic_keywords
from nltk.stem import PorterStemmer
import random
import re

app = Flask(__name__)
stemmer = PorterStemmer()


def get_stems(text):
    words = re.findall(r"[a-z0-9]+", text.lower())
    return {stemmer.stem(w) for w in words}


def keyword_found(keyword, answer_lower, answer_stems):
    if keyword.isalnum():
        return stemmer.stem(keyword) in answer_stems
    return keyword in answer_lower


@app.route('/')
def home():
    return "ML Service is running"


@app.route('/generate-question', methods=['POST'])
def generate_question():
    data = request.get_json()
    topic = data.get('topic', 'general programming')
    language = data.get('language', 'Python')

    template = random.choice(templates)
    question = template.format(topic=topic, language=language, topic1=topic, topic2="related concept")

    return jsonify({"question": question})


@app.route('/extract-skills', methods=['POST'])
def extract_skills():
    data = request.get_json()
    resume_text = data.get('text', '')

    found_skills = []
    for skill in known_skills:
        pattern = r"(?<![A-Za-z0-9])" + r"\s+".join(re.escape(p) for p in skill.split()) + r"(?![A-Za-z])"
        if re.search(pattern, resume_text, re.IGNORECASE):
            found_skills.append(skill)

    score = min(len(found_skills) * 10, 100)

    return jsonify({"skills": found_skills, "score": score})


@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    data = request.get_json()
    skills = data.get('skills', [])
    count = data.get('count', 5)

    questions = []
    seen = set()
    attempts = 0

    while len(questions) < count and skills and attempts < 50:
        attempts += 1
        skill = random.choice(skills)
        topics = skill_topics.get(skill, ["fundamentals"])
        topic1 = random.choice(topics)
        others = [t for t in topics if t != topic1]
        topic2 = random.choice(others) if others else topic1

        template = random.choice(templates)
        question = template.format(topic=topic1, language=skill, topic1=topic1, topic2=topic2)

        if question in seen:
            continue
        seen.add(question)
        questions.append({"skill": skill, "topic": topic1, "question": question})

    return jsonify({"questions": questions})


@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    data = request.get_json()
    topic = data.get('topic', 'fundamentals')
    answer = data.get('answer', '')

    keywords = topic_keywords.get(topic, topic_keywords["fundamentals"])
    answer_lower = answer.lower()
    answer_stems = get_stems(answer)

    matched = [kw for kw in keywords if keyword_found(kw, answer_lower, answer_stems)]
    missing = [kw for kw in keywords if kw not in matched]

    score = round(len(matched) / len(keywords) * 10, 1)

    word_count = len(answer.split())
    if word_count < 10:
        score = min(score, 4)

    if score >= 7:
        feedback = "Good answer. You covered the key points."
    elif score >= 4:
        feedback = "Decent attempt. Try to cover more key concepts."
    else:
        feedback = "Needs improvement. Revise this topic and add more detail."

    return jsonify({
        "score": score,
        "matched_keywords": matched,
        "missing_keywords": missing[:3],
        "feedback": feedback,
    })


if __name__ == '__main__':
    app.run(port=6001, debug=True)