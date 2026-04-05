import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import lightgbm as lgb
import json
import joblib

def mapk(actual, predicted, k=3):
    def apk(a, p, k):
        p = p[:k]
        score = 0.0
        hits = 0
        seen = set()
        for i, pred in enumerate(p):
            if pred in a and pred not in seen:
                hits += 1
                score += hits / (i + 1.0)
                seen.add(pred)
        return score / min(len(a), k)
    return np.mean([apk(a, p, k) for a, p in zip(actual, predicted)])

print("Loading dataset...")
df = pd.read_csv('Fertilizer Prediction.csv')
df.columns = df.columns.str.strip() # Fix spaces in column names

# Label Encoding
le_soil = LabelEncoder()
df['Soil Type'] = le_soil.fit_transform(df['Soil Type'])

le_crop = LabelEncoder()
df['Crop Type'] = le_crop.fit_transform(df['Crop Type'])

le_fert = LabelEncoder()
df['Fertilizer Name'] = le_fert.fit_transform(df['Fertilizer Name'])

X = df.drop(columns=['Fertilizer Name'])
y = df['Fertilizer Name']

print("Training XGBoost Classifier...")
model = xgb.XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, objective='multi:softprob')
model.fit(X, y)

# Get predictions for MAP@3 scoring on train set (for demo purposes)
preds_proba = model.predict_proba(X)
top_preds = np.argsort(preds_proba, axis=1)[:, -3:][:, ::-1]
actual = [[label] for label in y.values]

score = mapk(actual, top_preds, k=3)
print(f"XGBoost MAP@3 Score: {score:.5f}")

# Feature Importance
importance = model.feature_importances_
for col, imp in zip(X.columns, importance):
    print(f"{col}: {imp:.4f}")

# Save the model and encoders
model.save_model("fertilizer_xgb_model.json")
joblib.dump(le_soil, 'le_soil.pkl')
joblib.dump(le_crop, 'le_crop.pkl')
joblib.dump(le_fert, 'le_fert.pkl')

print("Fertilizer model and encoders saved successfully!")
