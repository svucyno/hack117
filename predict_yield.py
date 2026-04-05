import sys
import json
import pandas as pd
from catboost import CatBoostRegressor

def predict():
    try:
        # Read JSON input from command line arguments
        print("enter the list of data")
        print(sys.argv)
        input_data = json.loads(sys.argv[1])
        print(sys.argv)

        
        # Load Model
        model = CatBoostRegressor()
        model.load_model('yield_catboost_model.cbm')
        
        # Convert input dictionary directly to a Pandas DataFrame
        # The frontend/backend must send keys matching the training data exactly:
        # 'Crop_Type', 'Farm_Area(acres)', 'Irrigation_Type', 'Fertilizer_Used(tons)',
        # 'Pesticide_Used(kg)', 'Soil_Type', 'Season', 'Water_Usage(cubic meters)'
        df = pd.DataFrame([input_data])
        
        # Predict yield
        prediction = model.predict(df)[0]
        
        # Output JSON result format for Express.js backend
        print(json.dumps({"predictedYield": round(prediction, 2), "confidence": 0.85}))
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    predict()
