# Math Adventure 🎮📐

An educational math game for elementary students (Grades 1-6) featuring sound effects, rewards, progress tracking, and a colorful kid-friendly interface.

![Math Adventure](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=flat-square&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 🌟 Features

- **Multiple Operations**: Addition, Subtraction, Multiplication, Division
- **Grade Levels**: Difficulty scaling from Grade 1 to Grade 6
- **Timer-Based Gameplay**: 60 seconds per round
- **Streak Bonus**: Earn extra points for consecutive correct answers
- **Star Rewards**: Earn 1-3 stars based on accuracy
- **Leaderboard**: Save scores to Firebase and compete globally
- **Kid-Friendly UI**: Vibrant colors, animations, and engaging design
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gemongalaclark/InternshipOJT.git
   cd InternshipOJT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🎮 How to Play

1. **Enter your name** on the play page
2. **Select your grade level** (1-6)
3. **Choose an operation** (Addition, Subtraction, Multiplication, or Division)
4. **Solve math problems** before the timer runs out!
5. **Earn stars** based on your accuracy
6. **Save your score** to the leaderboard

## 📁 Project Structure

```
FRONTEND/math-adventure/
├── public/
│   └── sounds/           # Sound effects (mp3 files)
├── src/
│   ├── app/
│   │   ├── page.tsx      # Home page
│   │   ├── play/         # Difficulty selection
│   │   ├── game/         # Main game
│   │   ├── results/      # Score results
│   │   └── leaderboard/  # Top scores
│   └── lib/
│       ├── firebase.ts       # Firebase config
│       ├── gameEngine.ts     # Math problem generation
│       ├── soundManager.ts   # Audio handling
│       └── firestoreService.ts  # Database operations
```

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select a project
3. Add a Web App
4. Enable Firestore Database
5. Create a collection named `mathAdventureScores`

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

## 🛠️ Built With

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Firebase](https://firebase.google.com/) - Backend & Database
- [Howler.js](https://howlerjs.com/) - Audio library
- [CSS Modules](https://github.com/css-modules/css-modules) - Styling

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Clark Gemongala**  
OJT Game Development Project - 2026

---

Made with ❤️ for young learners
