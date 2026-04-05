# 🌱 HarvestMind (AgriPredict)

HarvestMind is an advanced, full-stack predictive agricultural platform designed to empower farmers and agricultural stakeholders with data-driven insights. By combining real-time machine learning predictions, interactive global mapping, and robust AI conversational assistance, HarvestMind helps optimize crop yield and precisely determine fertilizer requirements.

## ✨ Key Features

- **🌾 AI-Powered Crop Yield Prediction**: Leverages a robust **CatBoost** machine learning model (`yield_catboost_model.cbm`) running on the backend to forecast expected crop yields based on specific farm and weather data constraints.
- **🧪 Optimal Fertilizer Recommendation**: Uses an **XGBoost** model (`fertilizer_xgb_model.json`) integrated with Python `scikit-learn` encoders to determine exactly what fertilizers are needed for optimum soil health and crop growth.
- **🤖 Smart Agri-Bot**: An intelligent AI assistant built on advanced Large Language Models (e.g., Gemini). It is aware of surrounding weather data, context, and multi-language support (like Telugu), offering dynamic guidance straight from the UI.
- **🗺️ Live Global Mapping**: Integrates `react-leaflet` to visualize geographical locations.
- **📊 Real-time Data Analytics**: Dashboards that visualize live updates on predictions, sensor logs, and agricultural insights via `recharts`.
- **🔐 Role-Based Access Profiles**: Tailored experiences for Citizens, Officers, and Admins to manage and view relevant data.

## 💻 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion, and Recharts.
- **Backend**: Node.js, Express.js.
- **Database**: Drizzle ORM, MySQL.
- **Machine Learning**: Python 3, Scikit-Learn, CatBoost, XGBoost.
- **Language**: TypeScript across the core stacks natively handling type definitions and forms (via Zod).

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [Python 3.8+](https://www.python.org/downloads/) (to run the ML models)
- MySQL Server (XAMPP/WAMP or a standalone local instace)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/harvestmind.git
cd harvestmind
```

### 2. Install Dependencies

Install the necessary Node.js packages:

```bash
npm install
```

Install the required Python packages for the Machine Learning models (create a `requirements.txt` if needed, or install locally):

```bash
pip install pandas numpy scikit-learn catboost xgboost
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory (or use your existing configuration). An example connection string:

```env
DATABASE_URL="mysql://student:Student%40123@localhost:3306/agripredict"
SESSION_SECRET="your-super-secret-session-key"
PORT=5000
```
*(Also, add any necessary API keys, like Gemini, in the required `.env` paths or `api-keys.json`)*.

### 4. Database Setup

Create the MySQL database as defined in your connection string. Then, push the schema to automatically create the required tables:

```bash
npm run db:push
```

### 5. Run the Application

Start the development server. This single command builds the frontend using Vite and runs the Express backend server concurrently:

```bash
npm run dev
```

Visit the application locally in your browser at `http://localhost:5000`.

## 📦 Building for Production

To create a production-optimized build of your system, run:

```bash
npm run build
```

The compiled website and server entry files are output to the `dist` folder. You can test the production build locally via:

```bash
npm run start
```

## 🌍 Global Deployment

This repository requires both **Node.js** and **Python**. When deploying to a PaaS like Render or Railway:
1. Ensure your `.env` variables (Database URL, API Keys) are added strictly in the hosting provider dashboard.
2. Ensure you have a `requirements.txt` pushed to your root branch.
3. Establish the build command as `npm run build` and start command as `npm run start`. 

## 📝 License

This project is licensed under the MIT License.
