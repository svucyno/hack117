import sys
import json
import pandas as pd
import xgboost as xgb
import joblib

def predict():
    try:
        input_data = json.loads(sys.argv[1])
        model = xgb.XGBClassifier()
        model.load_model('fertilizer_xgb_model.json')
        
        le_soil = joblib.load('le_soil.pkl')
        le_crop = joblib.load('le_crop.pkl')
        le_fert = joblib.load('le_fert.pkl')
        
        df = pd.DataFrame([input_data])
        df.columns = df.columns.str.strip()
        
        # Handle categorical encoding safely
        soil_val = df['Soil Type'].iloc[0]
        if soil_val in le_soil.classes_:
            df['Soil Type'] = le_soil.transform(df['Soil Type'])
        else:
            df['Soil Type'] = 0

        crop_val = df['Crop Type'].iloc[0]
        if crop_val in le_crop.classes_:
            df['Crop Type'] = le_crop.transform(df['Crop Type'])
        else:
            df['Crop Type'] = 0
            
        probs = model.predict_proba(df)[0]
        top_indices = probs.argsort()[-3:][::-1]
        
        recommendations = []
        for idx in top_indices:
            recommendations.append({
                "fertilizer": le_fert.inverse_transform([idx])[0],
                "probability": round(float(probs[idx]) * 100, 1)
            })
            
        result = {
            "optimal": recommendations[0]["fertilizer"], 
            "score": recommendations[0]["probability"], 
            "alternatives": recommendations[1:]
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    predict()
