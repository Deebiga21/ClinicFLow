const express = require('express');
const router = express.Router();
const Flashcard = require('../models/Flashcard');
const Treatment = require('../models/Treatment');
const Token = require('../models/Token');
const Doctor = require('../models/Doctor');

const DEFAULT_FLASHCARDS = [
  {
    idKey: 'fever',
    title: 'Fever (Pyrexia)',
    subtitle: 'Body temp > 99.5°F (37.5°C)',
    tagClass: 'flashcard__tag--fever',
    category: 'General & Viral Infections',
    symptoms: ['Elevated body temperature', 'Chills & shivering', 'Sweating', 'Body aches', 'Fatigue'],
    homeCare: [
      'Lukewarm water sponge bathing (avoid cold water shocks).',
      'Maintain continuous fluid intake (ORSL, coconut water, soups).',
      'Wear lightweight, breathable clothing.',
      'Ensure adequate rest in a well-ventilated room.'
    ],
    otcMedications: [
      'Paracetamol / Acetaminophen (500mg - 650mg every 4-6 hrs as needed, max 4g/day).',
      'Ibuprofen (if advised by doctor, avoid in suspected Dengue).'
    ],
    redFlags: [
      'Temperature > 103°F (39.4°C) lasting over 3 days.',
      'Stiff neck, severe photophobia, or confusion.',
      'Breathing difficulty or severe chest pain.'
    ],
    medicalTip: 'Avoid aspirin in children under 16 due to risk of Reye\'s Syndrome.'
  },
  {
    idKey: 'flu',
    title: 'Flu & Common Cold',
    subtitle: 'Influenza & Upper Respiratory Infection',
    tagClass: 'flashcard__tag--flu',
    category: 'Respiratory',
    symptoms: ['Runny or congested nose', 'Sore throat & cough', 'Sneezing', 'Low-grade fever', 'Mild headache'],
    homeCare: [
      'Steam inhalation with eucalyptus or saline drops twice daily.',
      'Warm salt-water gargles (3-4 times a day).',
      'Honey and ginger tea for throat soothing.',
      'Hydrate with warm fluids and broth.'
    ],
    otcMedications: [
      'Antihistamines (Cetirizine / Levocetirizine for nasal congestion).',
      'Decongestant sprays (Oxymetazoline - max 3-5 consecutive days).',
      'Throat lozenges (Amylmetacresol / Dichlorobenzyl alcohol).'
    ],
    redFlags: [
      'Shortness of breath, wheezing, or bluish lips.',
      'Persistent high fever returning after initial fever drop.',
      'Inability to swallow liquids.'
    ],
    medicalTip: 'Antibiotics do not work against viral flu or cold infections.'
  },
  {
    idKey: 'constipation',
    title: 'Constipation',
    subtitle: 'Infrequent or painful bowel movements',
    tagClass: 'flashcard__tag--constipation',
    category: 'Gastrointestinal',
    symptoms: ['Fewer than 3 bowel movements per week', 'Hard, dry, or lumpy stools', 'Straining during defecation', 'Abdominal bloating'],
    homeCare: [
      'Increase dietary fiber intake (prunes, oatmeal, psyllium husk / Isabgol).',
      'Drink at least 2.5 to 3 Liters of water daily.',
      'Engage in 20-30 mins of light walking to stimulate intestinal peristalsis.',
      'Establish a regular bowel schedule.'
    ],
    otcMedications: [
      'Bulk-forming laxatives (Psyllium Husk / Isabgol with full glass of water).',
      'Osmotic laxatives (Lactulose / Polyethylene Glycol syrup).',
      'Stool softeners (Docusate Sodium).'
    ],
    redFlags: [
      'Severe abdominal pain with vomiting and inability to pass gas.',
      'Blood in stool or rectal bleeding.',
      'Unexplained weight loss or sudden onset constipation in adults > 50.'
    ],
    medicalTip: 'Do not rely on stimulant laxatives (e.g. Senna) for long-term daily use.'
  },
  {
    idKey: 'loose-motion',
    title: 'Loose Motion (Diarrhea)',
    subtitle: 'Frequent watery bowel movements',
    tagClass: 'flashcard__tag--loose-motion',
    category: 'Gastrointestinal',
    symptoms: ['Watery stools (> 3 times/day)', 'Abdominal cramps', 'Nausea', 'Urgency to evacuate', 'Dehydration signs'],
    homeCare: [
      'Immediate Oral Rehydration Solution (ORS) after every loose stool.',
      'BRAT Diet (Bananas, Rice, Applesauce, Toast).',
      'Probiotic-rich yogurt / buttermilk (curd with cumin).',
      'Avoid dairy, spicy foods, caffeine, and artificial sugars.'
    ],
    otcMedications: [
      'ORS Packets (WHO recommended formula).',
      'Probiotic capsules (Saccharomyces boulardii / Bacillus clausii).',
      'Loperamide (ONLY for acute non-infectious diarrhea without blood/fever).'
    ],
    redFlags: [
      'Blood or mucus in stool (Dysentery signs).',
      'High fever (> 101.5°F) accompanying diarrhea.',
      'Severe dehydration (sunken eyes, extreme thirst, dry mouth, no urine in 6 hrs).'
    ],
    medicalTip: 'Primary goal is fluid and electrolyte replacement, not stopping bowel movements.'
  },
  {
    idKey: 'vomiting',
    title: 'Vomiting & Nausea',
    subtitle: 'Gastric emesis & stomach upset',
    tagClass: 'flashcard__tag--vomiting',
    category: 'Gastrointestinal',
    symptoms: ['Nausea & retching', 'Involuntary stomach emptying', 'Excessive salivation', 'Cold sweats', 'Dizziness'],
    homeCare: [
      'Withhold solid food for 2-3 hours after vomiting.',
      'Sip small quantities of clear fluids (ORS, electrolyte water) every 10-15 mins.',
      'Ginger tea or mint candy to relieve nausea.',
      'Gradually reintroduce bland foods (dry crackers, rice broth).'
    ],
    otcMedications: [
      'Ondansetron 4mg (Orally Disintegrating Tablet - as prescribed/advised).',
      'Domperidone / Metoclopramide (Anti-emetics).'
    ],
    redFlags: [
      'Vomiting blood or coffee-ground like material.',
      'Inability to retain any liquids for more than 12 hours.',
      'Severe headache, neck stiffness, or confusion alongside emesis.'
    ],
    medicalTip: 'Do not drink large amounts of water at once; small frequent sips prevent triggering retching.'
  },
  {
    idKey: 'acidity',
    title: 'Acidity & GERD / Heartburn',
    subtitle: 'Acid reflux & substernal burning',
    tagClass: 'flashcard__tag--acidity',
    category: 'Gastrointestinal',
    symptoms: ['Burning chest pain behind breastbone', 'Acid regurgitation', 'Sour taste in throat', 'Bloating & belching'],
    homeCare: [
      'Avoid lying down for 2-3 hours after meals.',
      'Elevate head of bed by 6 inches while sleeping.',
      'Eat smaller, frequent meals instead of heavy dinners.',
      'Avoid trigger foods (citrus, spicy, fried, carbonated drinks, chocolate).'
    ],
    otcMedications: [
      'Antacid Liquids / Chewables (Magnesium & Aluminium Hydroxide with Simethicone).',
      'H2 Blockers (Famotidine 20mg).',
      'Proton Pump Inhibitors (Omeprazole 20mg / Pantoprazole 40mg taken 30 mins before breakfast).'
    ],
    redFlags: [
      'Chest pain radiating to jaw, left arm, or back (may mimic heart attack!).',
      'Difficulty or pain when swallowing food (dysphagia).',
      'Black tarry stools.'
    ],
    medicalTip: 'Sudden severe chest burning in adults over 40 should always be checked to rule out cardiac causes.'
  }
];

// Helper: Seed default flashcards if empty
async function seedFlashcardsIfEmpty() {
  try {
    const count = await Flashcard.countDocuments();
    if (count === 0) {
      await Flashcard.insertMany(DEFAULT_FLASHCARDS);
      console.log('Seeded default Clinical AI flashcards into database.');
    }
  } catch (err) {
    console.error('Error seeding flashcards:', err);
  }
}

// GET /api/clinical-ai/flashcards
router.get('/clinical-ai/flashcards', async (req, res) => {
  try {
    await seedFlashcardsIfEmpty();
    const flashcards = await Flashcard.find().sort({ createdAt: -1 });
    res.json(flashcards);
  } catch (err) {
    console.error('GET /api/clinical-ai/flashcards error:', err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// POST /api/clinical-ai/flashcards - Create flashcard
router.post('/clinical-ai/flashcards', async (req, res) => {
  try {
    const { title, subtitle, category, tagClass, symptoms, homeCare, otcMedications, redFlags, medicalTip } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const idKey = req.body.idKey || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCard = await Flashcard.create({
      idKey,
      title,
      subtitle: subtitle || '',
      category,
      tagClass: tagClass || 'flashcard__tag--fever',
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      homeCare: Array.isArray(homeCare) ? homeCare : [],
      otcMedications: Array.isArray(otcMedications) ? otcMedications : [],
      redFlags: Array.isArray(redFlags) ? redFlags : [],
      medicalTip: medicalTip || ''
    });

    res.status(201).json(newCard);
  } catch (err) {
    console.error('POST /api/clinical-ai/flashcards error:', err);
    res.status(500).json({ error: 'Failed to create flashcard' });
  }
});

// POST /api/clinical-ai/ask - Clinical AI Q&A Assistant endpoint
router.post('/clinical-ai/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const q = question.toLowerCase();

    // 1. Check for Treatment/Scan questions
    if (q.includes('treatment') || q.includes('scan') || q.includes('cost') || q.includes('price') || q.includes('mri') || q.includes('xray') || q.includes('ultrasound')) {
      const treatments = await Treatment.find();
      const matchedTreatment = treatments.find(t => 
        t.name.toLowerCase().includes(q) || 
        q.includes(t.name.split(' ')[0].toLowerCase())
      );
      if (matchedTreatment) {
         return res.json({
           question,
           answer: `Yes, we offer **${matchedTreatment.name}** (${matchedTreatment.category}).\n• **Cost:** ${matchedTreatment.currency}${matchedTreatment.cost}\n• **Turnaround:** ${matchedTreatment.turnaround}\n• **Prep:** ${matchedTreatment.prep}`,
           conditionMatched: 'Treatment Info'
         });
      } else {
         return res.json({
           question,
           answer: `We offer a variety of treatments and scans (like MRI, CT, Ultrasound, Lab tests). Please visit the 'Treatments & Scans' page for a full catalog and pricing.`,
           conditionMatched: 'Treatment Info'
         });
      }
    }

    // 2. Check for Queue/Wait Time questions
    if (q.includes('queue') || q.includes('wait') || q.includes('how many patients') || q.includes('long')) {
      const waitingCount = await Token.countDocuments({ status: 'waiting' });
      return res.json({
        question,
        answer: `Currently, there are **${waitingCount}** patients waiting in the queue.\nThe average consultation takes about 10-15 minutes per patient.`,
        conditionMatched: 'Queue Info'
      });
    }

    // 3. Check for Doctor availability questions
    if (q.includes('doctor') || q.includes('who is available') || q.includes('physician')) {
      const doctors = await Doctor.find({ isAvailable: true });
      if (doctors.length > 0) {
        return res.json({
          question,
          answer: `The following doctors are currently available/accepting patients:\n` + doctors.map(d => `• **Dr. ${d.name}** (${d.department}) - Room ${d.roomNumber}`).join('\n'),
          conditionMatched: 'Doctor Info'
        });
      } else {
        return res.json({
          question,
          answer: `It looks like no doctors are currently set as 'Available' in the system. Please check with the front desk.`,
          conditionMatched: 'Doctor Info'
        });
      }
    }

    // 4. Default: Clinical Flashcards
    await seedFlashcardsIfEmpty();
    const flashcards = await Flashcard.find();

    const matchedCard = flashcards.find(c => 
      c.title.toLowerCase().includes(q) || 
      c.symptoms.some(s => s.toLowerCase().includes(q))
    );

    let answer = '';
    if (matchedCard) {
      answer = `Based on our Clinical AI database for **${matchedCard.title}**:\n` +
               `• **Key Symptoms:** ${matchedCard.symptoms.slice(0, 3).join(', ')}\n` +
               `• **First Line Care:** ${matchedCard.homeCare[0] || 'Rest and hydration'}\n` +
               `• **Recommended OTC:** ${matchedCard.otcMedications[0] || 'Consult physician'}\n` +
               `⚠️ **Red Flag Warning:** ${matchedCard.redFlags[0] || 'High fever lasting over 3 days'}`;
    } else {
      answer = `Thank you for asking about "${question}". The Clinical Assistant recommends consulting with our clinic physician for personalized advice. Ensure adequate hydration and monitor for any severe symptoms.`;
    }

    res.json({
      question,
      answer,
      conditionMatched: matchedCard ? matchedCard.title : null
    });
  } catch (err) {
    console.error('POST /api/clinical-ai/ask error:', err);
    res.status(500).json({ error: 'Failed to process Clinical AI query' });
  }
});

module.exports = router;
