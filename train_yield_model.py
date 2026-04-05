import pandas as pd
from catboost import CatBoostRegressor

def train():
    print("Loading farm_yield_dataset.csv...")
    df = pd.read_csv('farm_yield_dataset.csv')

    # Ensure no trailing spaces in column names
    df.columns = df.columns.str.strip()

    # Features and Target
    # Farm_ID is not a feature
    X = df.drop(columns=['Farm_ID', 'Yield(tons)'])
    y = df['Yield(tons)']

    # Identify categorical features
    cat_features = ['Crop_Type', 'Irrigation_Type', 'Soil_Type', 'Season']
    
    # Initialize CatBoostRegressor
    print("Training CatBoostRegressor...")
    model = CatBoostRegressor(
        iterations=200,
        learning_rate=0.1,
        depth=6,
        loss_function='RMSE',
        cat_features=cat_features,
        verbose=20
    )

    # Train the model
    model.fit(X, y)

    # Save the model
    model.save_model('yield_catboost_model.cbm')
    print("Model successfully trained and saved to 'yield_catboost_model.cbm'")

if __name__ == "__main__":
    train()
