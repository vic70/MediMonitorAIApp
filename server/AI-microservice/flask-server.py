from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the pre-trained model once on startup
model = tf.keras.models.load_model("model.h5")  # adjust the path if needed

features_order = [
    "breathingProblem",
    "fever",
    "dryCough",
    "soreThroat",
    "runningNose",
    "asthma",
    "chronicLungDisease",
    "headache",
    "heartDisease",
    "diabetes",
    "hyperTension",
    "fatigue",
    "gastrointestinal",
    "abroadTravel",
    "contactWithCovidPatient",
    "attendedLargeGathering",
    "visitedPublicExposedPlaces",
    "familyWorkingInPublicExposedPlaces",
]


def preprocess_input(json_data, feature_order):
    """
    Convert and reshape raw input data according to the model's requirements.
    Modify this function based on how your model expects the input.
    """
    
    print('json_data in preprocess_input', json_data);
    
    # Remove fields not used for prediction (e.g., 'label')
    data = {key: value for key, value in json_data.items() if key in feature_order}
    
    # Build a list following the training feature order.
    # This assumes that each expected key is present in the JSON, otherwise you may need to handle missing data.
    ordered_features = [data[key] for key in feature_order]
    
    # Convert to a numpy array and reshape for a single sample input (if needed)
    processed_input = np.array(ordered_features).reshape(1, -1)
    return processed_input


@app.route('/predict', methods=['POST'])
def predict():
    # Get JSON payload from the incoming request
    data = request.get_json(force=True)
    
    print('data in predict', data);


    # Preprocess the input data (adjust according to your model's input shape)
    processed_data = preprocess_input(data, features_order)
    
    print('processed_data in predict', processed_data);
    
    # Run model prediction
    prediction = model.predict(processed_data)

    # Convert prediction result to a list for JSON serialization
    result = prediction.tolist()

    # Return the prediction as JSON
    return jsonify({"prediction": result})

if __name__ == '__main__':
    # Run the Flask app (use debug mode only during development)
    app.run(debug=True, host='0.0.0.0', port=5000)
