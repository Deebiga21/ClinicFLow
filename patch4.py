with open('core_backend/services/admin_service.py', 'r') as f:
    text = f.read()

new_func = """    def get_model_performance(self, model_id):
        import json
        MODEL_NAME_MAP = {
            'waitingTime': 'Waiting Time',
            'consultationDuration': 'Consultation Duration',
            'noShow': 'No-Show',
            'anomalyDetection': 'Anomaly Detection'
        }
        db_name = MODEL_NAME_MAP.get(model_id)
        if not db_name: return None
        
        with self.Session() as session:
            row = session.execute(text("SELECT * FROM model_versions WHERE model_name = :name AND status = 'Active' ORDER BY training_date DESC LIMIT 1"), {'name': db_name}).mappings().fetchone()
            if not row: return None
            
            metrics = json.loads(row['metrics']) if row['metrics'] else {}
            if 'MAE' in metrics:
                m_type = 'regression'
                m = {'mae': metrics.get('MAE'), 'rmse': metrics.get('RMSE'), 'r2': metrics.get('R2')}
            elif 'Precision' in metrics:
                m_type = 'classification'
                m = {'precision': metrics.get('Precision'), 'recall': metrics.get('Recall'), 'f1': metrics.get('F1'), 'rocAuc': metrics.get('ROC-AUC')}
            else:
                m_type = 'anomaly'
                m = metrics
                
            return {
                'trainingDatasetSize': int(row['training_rows'] * 0.8) if row['training_rows'] else 0,
                'testDatasetSize': int(row['training_rows'] * 0.2) if row['training_rows'] else 0,
                'trainingDate': row['training_date'].split(' ')[0] if row['training_date'] else 'N/A',
                'modelVersion': row['version'],
                'lastEvaluation': row['training_date'],
                'modelType': m_type,
                'metrics': m,
                'performanceOverTime': [],
                'chartData': []
            }"""

text = text.replace('    def get_model_performance(self, model_id):\n        return None', new_func)

with open('core_backend/services/admin_service.py', 'w') as f:
    f.write(text)
