# Results Folder
Folder ini berisi metrik evaluasi model dan statistik hasil analisis.

## File yang Akan Dibuat:
- `confusion_matrix.csv` - Confusion matrix dari testing data
- `area_statistics.json` - Statistik luas area (dalam hektar)
- `aprf_metrics.json` - Accuracy, Precision, Recall, F1-Score

## Format File:

### confusion_matrix.csv
```csv
,Predicted_0,Predicted_1
Actual_0,42,8
Actual_1,5,35
```

### area_statistics.json
```json
{
  "builtup_2023_2024_ha": 1250.5,
  "builtup_2026_ha": 1580.3,
  "gain_ha": 345.8,
  "loss_ha": 16.0,
  "net_change_ha": 329.8,
  "percent_change": 26.4
}
```

### aprf_metrics.json
```json
{
  "accuracy": 0.87,
  "precision": 0.85,
  "recall": 0.89,
  "f1_score": 0.87,
  "kappa": 0.74
}
```

**Catatan:** File-file ini dapat di-export dari Google Earth Engine atau ditulis manual berdasarkan output console GEE.
