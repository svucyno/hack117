import pandas as pd
import json

df = pd.read_csv('Fertilizer Prediction.csv')
df.columns = df.columns.str.strip()

analytics = {}

# 1. Total records & Averages
analytics['total_records'] = len(df)
analytics['avg_temp'] = round(df['Temparature'].mean(), 1)
analytics['avg_humidity'] = round(df['Humidity'].mean(), 1)
analytics['avg_moisture'] = round(df['Moisture'].mean(), 1)
analytics['avg_n'] = round(df['Nitrogen'].mean(), 1)
analytics['avg_p'] = round(df['Phosphorous'].mean(), 1)
analytics['avg_k'] = round(df['Potassium'].mean(), 1)

# 2. KPI / Top Performers
fert_counts = df['Fertilizer Name'].value_counts()
analytics['top_fertilizer'] = fert_counts.index[0]
analytics['most_common_crop'] = df['Crop Type'].value_counts().index[0]

# 3. Crop Share Data
crop_counts = df['Crop Type'].value_counts().to_dict()
analytics['crop_share'] = crop_counts

# 4. Soil Compatibility Matrix
# We need it formatted for heatmap: Z[y][x], where y is soil, x is fertilizer
soil_fert = pd.crosstab(df['Soil Type'], df['Fertilizer Name'])
analytics['matrix_soil_types'] = list(soil_fert.index)
analytics['matrix_ferts'] = list(soil_fert.columns)
analytics['matrix_z'] = soil_fert.values.tolist()

# 5. Correlation Matrix
numeric_cols = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
corr = df[numeric_cols].corr().round(2)
analytics['corr_vars'] = numeric_cols
analytics['corr_z'] = corr.values.tolist()

# 6. Scatter Data (Env vs Nitrogen)
analytics['scatter_env'] = df[['Temparature', 'Humidity', 'Nitrogen', 'Crop Type']].head(60).to_dict(orient='records')

# 7. 3D Nutrient Space
analytics['nutrient_3d'] = df[['Nitrogen', 'Phosphorous', 'Potassium', 'Crop Type', 'Moisture']].to_dict(orient='records')

# 8. Fertilizer Impact Bar Chart (Mock productivity scores since yield isn't in this dataset, using Nitrogen correlation)
fert_scores = df.groupby('Fertilizer Name')['Nitrogen'].mean().to_dict()
analytics['fert_scores'] = fert_scores

# Output
with open('public/analytics_data.json', 'w') as f:
    json.dump(analytics, f)

print("Analytics Data Generated successfully in public/analytics_data.json!")
