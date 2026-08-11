const express = require('express');
const router = express.Router();
const Treatment = require('../models/Treatment');

const DEFAULT_TREATMENTS = [
  {
    idKey: 'mri-brain',
    name: 'MRI Brain (3.0 Tesla High-Res)',
    category: 'Imaging & Scans',
    cost: 4500,
    currency: '₹',
    turnaround: 'Same Day (4 Hours)',
    prep: 'No metal items/pacemakers. Fasting for 3 hours prior.',
    description: 'High-resolution neuroimaging for severe headaches, seizure, memory evaluation, and cranial vessel scans.',
    popular: true
  },
  {
    idKey: 'ct-chest',
    name: 'CT Chest HRCT (High Resolution)',
    category: 'Imaging & Scans',
    cost: 3200,
    currency: '₹',
    turnaround: '2-3 Hours',
    prep: '4 hours fasting if contrast dye is required.',
    description: 'Detailed 3D imaging of pulmonary structures, airway assessment, and parenchymal infection screening.',
    popular: true
  },
  {
    idKey: 'usg-abdomen',
    name: 'Ultrasound Whole Abdomen & Pelvis',
    category: 'Imaging & Scans',
    cost: 1200,
    currency: '₹',
    turnaround: 'Instant / 30 Mins',
    prep: 'Full bladder required (drink 1L water 1 hr before scan).',
    description: 'Comprehensive sonogram for liver, gallbladder, kidneys, pancreas, spleen, and pelvic organs.',
    popular: true
  },
  {
    idKey: 'xray-chest',
    name: 'Digital Chest X-Ray (PA View)',
    category: 'Imaging & Scans',
    cost: 450,
    currency: '₹',
    turnaround: '15 Mins',
    prep: 'No special preparation needed.',
    description: 'Quick digital radiography for respiratory infections, rib injury, and cardiomegaly screening.',
    popular: false
  },
  {
    idKey: 'ecg-cardiac',
    name: '12-Lead Digital ECG',
    category: 'Cardiology',
    cost: 350,
    currency: '₹',
    turnaround: 'Immediate',
    prep: 'Avoid heavy exercise right before test.',
    description: 'Non-invasive electrical activity monitoring of heart rhythm, arrhythmia, and ischemia detection.',
    popular: true
  },
  {
    idKey: 'echo-2d',
    name: '2D Echocardiogram with Color Doppler',
    category: 'Cardiology',
    cost: 2200,
    currency: '₹',
    turnaround: '1 Hour',
    prep: 'Wear comfortable two-piece clothing.',
    description: 'Ultrasound evaluation of cardiac chamber movement, valve functionality, and ejection fraction.',
    popular: false
  },
  {
    idKey: 'cbc-esr',
    name: 'Complete Blood Count (CBC) + ESR',
    category: 'Pathology & Labs',
    cost: 400,
    currency: '₹',
    turnaround: '4 Hours',
    prep: 'Overnight fasting (8-10 hours) recommended.',
    description: 'Measures Hb, WBC differential, platelet count, RBC indices, and systemic inflammation marker.',
    popular: true
  },
  {
    idKey: 'lft-kft-combo',
    name: 'Comprehensive Liver & Kidney Profile',
    category: 'Pathology & Labs',
    cost: 950,
    currency: '₹',
    turnaround: '6 Hours',
    prep: '10-12 hours strict fasting.',
    description: 'Evaluates Bilirubin, SGOT, SGPT, Creatinine, Blood Urea, Uric Acid, Electrolytes, and Proteins.',
    popular: true
  },
  {
    idKey: 'hba1c-lipid',
    name: 'HbA1c & Fasting Lipid Profile',
    category: 'Pathology & Labs',
    cost: 850,
    currency: '₹',
    turnaround: '6 Hours',
    prep: '12 hours overnight fasting.',
    description: 'Average 3-month blood glucose control alongside Cholesterols (HDL, LDL, Triglycerides).',
    popular: false
  },
  {
    idKey: 'thyroid-t3-t4-tsh',
    name: 'Thyroid Profile (Total T3, T4 & TSH)',
    category: 'Pathology & Labs',
    cost: 650,
    currency: '₹',
    turnaround: 'Same Day',
    prep: 'Morning sample before thyroid medication.',
    description: 'Screening for hypothyroidism, hyperthyroidism, and metabolic endocrine imbalances.',
    popular: false
  },
  {
    idKey: 'iv-drip-hydration',
    name: 'Emergency IV Hydration & Electrolyte Infusion',
    category: 'Treatments & Procedures',
    cost: 1500,
    currency: '₹',
    turnaround: '45-60 Mins',
    prep: 'Administered in clinic day-care lounge.',
    description: 'Rapid rehydration for acute gastroenteritis, severe dehydration, heat stroke, or post-vomiting weakness.',
    popular: true
  },
  {
    idKey: 'nebulization-therapy',
    name: 'Targeted Bronchodilator Nebulization',
    category: 'Treatments & Procedures',
    cost: 300,
    currency: '₹',
    turnaround: '20 Mins',
    prep: 'None. Inhalation therapy.',
    description: 'Inhalation therapy for acute asthma attack, bronchospasm, bronchitis, and wheezing relief.',
    popular: false
  },
  {
    idKey: 'wound-dressing',
    name: 'Sterile Wound Care & Suturing',
    category: 'Treatments & Procedures',
    cost: 800,
    currency: '₹',
    turnaround: '30 Mins',
    prep: 'Local anesthesia administered if suturing required.',
    description: 'Antiseptic cleaning, debridement, sterile bandaging, or minor laceration suture repair.',
    popular: false
  },
  {
    idKey: 'physio-session',
    name: 'Focused Musculoskeletal Physiotherapy',
    category: 'Treatments & Procedures',
    cost: 700,
    currency: '₹',
    turnaround: '45 Mins',
    prep: 'Wear flexible athletic attire.',
    description: 'Manual therapy, ultrasound heat therapy, and targeted exercises for back pain, joint stiffness, and neck spasm.',
    popular: false
  }
];

// Helper: Seed default treatments if empty
async function seedTreatmentsIfEmpty() {
  try {
    const count = await Treatment.countDocuments();
    if (count === 0) {
      await Treatment.insertMany(DEFAULT_TREATMENTS);
      console.log('Seeded default hospital treatments & scans into database.');
    }
  } catch (err) {
    console.error('Error seeding treatments:', err);
  }
}

// GET /api/treatments
router.get('/treatments', async (req, res) => {
  try {
    await seedTreatmentsIfEmpty();
    const { category, search } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const treatments = await Treatment.find(query).sort({ category: 1, popular: -1, name: 1 });
    res.json(treatments);
  } catch (err) {
    console.error('GET /api/treatments error:', err);
    res.status(500).json({ error: 'Failed to fetch treatments' });
  }
});

// POST /api/treatments - Add a new treatment scan
router.post('/treatments', async (req, res) => {
  try {
    const { name, category, cost, currency, turnaround, prep, description, popular } = req.body;
    if (!name || !category || cost === undefined) {
      return res.status(400).json({ error: 'Name, category, and cost are required' });
    }

    const idKey = req.body.idKey || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newTreatment = await Treatment.create({
      idKey,
      name,
      category,
      cost: Number(cost),
      currency: currency || '₹',
      turnaround: turnaround || 'Same Day',
      prep: prep || 'None',
      description: description || '',
      popular: Boolean(popular)
    });

    res.status(201).json(newTreatment);
  } catch (err) {
    console.error('POST /api/treatments error:', err);
    res.status(500).json({ error: 'Failed to create treatment' });
  }
});

// PUT /api/treatments/:id - Update treatment
router.put('/treatments/:id', async (req, res) => {
  try {
    const updated = await Treatment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Treatment not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update treatment' });
  }
});

// DELETE /api/treatments/:id - Delete treatment
router.delete('/treatments/:id', async (req, res) => {
  try {
    const deleted = await Treatment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Treatment not found' });
    res.json({ message: 'Treatment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete treatment' });
  }
});

module.exports = router;
