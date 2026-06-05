const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files are allowed!'));
    }
  }
});

const mockUsers = [
  {
    user_id: 1,
    fname: 'John',
    lname: 'Doe',
    email: 'sample@example.com',
    gender: 'Male',
    phone_number: '+919876543210',
    department: 'Deck',
    rank: 'Third Officer',
    date_available: '2026-06-01',
    password: bcrypt.hashSync('Sample123', 10),
    date_of_birth: '1998-05-15',
    place_of_birth: 'Mumbai, India',
    nationality: 'Indian',
    height_cm: '175',
    weight_kg: '70',
    eye_color: 'Brown',
    marital_status: 'Single',
    father_name: 'Robert Doe',
    home_address: '123 Main Street, Mumbai, Maharashtra 400001',
    passport: {
      number: 'A1234567',
      issue_date: '2020-01-01',
      expiry_date: '2030-01-01',
      place_of_issue: 'Mumbai',
      issued_by: 'Government of India'
    },
    seaman_book: {
      number: 'CDC-7654321',
      issue_date: '2018-01-01',
      expiry_date: '2028-01-01',
      issued_by: 'Mercantile Marine Department'
    },
    certificates: [
      {
        name: 'STCW Basic Safety Training',
        certificate_no: 'STCW-12345',
        issue_date: '2020-01-01',
        expiry_date: '2025-01-01',
        issued_by: 'Indian Maritime University'
      }
    ],
    experiences: [
      {
        company_name: 'Ocean Shipping Co.',
        vessel_name: 'MV Ocean Star',
        type: 'Bulk Carrier',
        rank: 'Third Officer',
        sign_on: '2021-01-01',
        sign_off: '2022-01-01',
        months: 12
      }
    ],
    licences: [
      {
        type: 'COC',
        name: 'Certificate of Competency',
        number: 'COC-987654',
        grade: 'Master Class IV',
        issue_date: '2019-01-01',
        expiry_date: '2029-01-01',
        issued_place: 'Mumbai',
        issued_by: 'Mercantile Marine Department'
      }
    ],
    medical_cert: {
      has_medical: true,
      medical: {
        certificate_number: 'MED-54321',
        issued_by: 'Port Health Organisation',
        issue_date: '2023-01-01',
        expiry_date: '2025-01-01'
      },
      has_yellow_fever: true,
      yellow_fever: {
        certificate_number: 'YF-12345',
        issued_by: 'WHO Approved Center',
        issue_date: '2023-01-01',
        expiry_date: '2033-01-01'
      }
    }
  }
];

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user });
});

app.post('/register', async (req, res) => {
  try {
    const { fname, email, pass } = req.body;

    if (!fname || !email || !pass) {
      return res.send('<script>alert("Please fill all fields"); window.location.href="/register";</script>');
    }

    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return res.send('<script>alert("Email already exists!"); window.location.href="/";</script>');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = {
      user_id: mockUsers.length + 1,
      fname: fname.split(' ')[0] || fname,
      lname: fname.split(' ').slice(1).join(' ') || '',
      email: email,
      date_available: '2026-06-01',
      rank: 'Deck Cadet',
      department: 'Deck',
      phone_number: '',
      password: hashedPassword,
      gender: '',
      date_of_birth: '',
      place_of_birth: '',
      nationality: '',
      height_cm: '',
      weight_kg: '',
      eye_color: '',
      marital_status: '',
      father_name: '',
      home_address: '',
      passport: { number: '', issue_date: '', expiry_date: '', place_of_issue: '', issued_by: '' },
      seaman_book: { number: '', issue_date: '', expiry_date: '', issued_by: '' },
      certificates: [],
      experiences: [],
      licences: [],
      medical_cert: { has_medical: false, medical: null, has_yellow_fever: false, yellow_fever: null }
    };
    mockUsers.push(newUser);

    res.send('<script>alert("Registration successful!"); window.location.href="/login";</script>');
  } catch (error) {
    console.error(error);
    res.send('<script>alert("Registration failed!"); window.location.href="/register";</script>');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.send('<script>alert("Please fill all fields"); window.location.href="/login";</script>');
    }

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.send('<script>alert("Email not found!"); window.location.href="/login";</script>');
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);
    if (!passwordMatch) {
      return res.send('<script>alert("Incorrect password!"); window.location.href="/login";</script>');
    }

    req.session.user = user;
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.send('<script>alert("Login failed!"); window.location.href="/login";</script>');
  }
});

app.get('/admin/login', (req, res) => {
  res.render('admin-login', { admin: req.session.admin });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin') {
    req.session.admin = { username: 'admin' };
    res.redirect('/admin/dashboard');
  } else {
    res.send('<script>alert("Invalid admin credentials!"); window.location.href="/admin/login";</script>');
  }
});

app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }
  
  res.render('admin-dashboard', { admin: req.session.admin, users: mockUsers });
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('dashboard', { user: req.session.user });
});

app.get('/profile', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.redirect('/dashboard');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/profile/edit', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('edit-profile', { user: req.session.user });
});

app.post('/profile/edit', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
    if (!user) {
        return res.redirect('/login');
    }

    const {
        fname, lname, email, date_available, phone_number, gender,
        date_of_birth, place_of_birth, nationality, height_cm, weight_kg,
        eye_color, marital_status, father_name, home_address,
        passport_number, passport_issue_date, passport_expiry_date,
        passport_place_of_issue, passport_issued_by,
        seaman_book_number, seaman_book_issue_date, seaman_book_expiry_date,
        seaman_book_issued_by,
        department, rank,
        has_medical, med_certificate_number, med_issued_by, med_issue_date, med_expiry_date,
        has_yellow_fever, yf_certificate_number, yf_issued_by, yf_issue_date, yf_expiry_date
    } = req.body;

    // Validate age (must be 18+)
    if (date_of_birth) {
        const dob = new Date(date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 18) {
            return res.send('<script>alert("You must be at least 18 years old"); window.location.href="/profile/edit";</script>');
        }
    }

    // Update user data
    user.fname = fname || user.fname;
    user.lname = lname || user.lname;
    user.email = email || user.email;
    user.phone_number = phone_number || user.phone_number;
    user.gender = gender || user.gender;
    user.department = department || user.department;
    user.rank = rank || user.rank;
    user.date_available = date_available || user.date_available;

    user.date_of_birth = date_of_birth || user.date_of_birth;
    user.place_of_birth = place_of_birth || user.place_of_birth;
    user.nationality = nationality || user.nationality;
    user.height_cm = height_cm || user.height_cm;
    user.weight_kg = weight_kg || user.weight_kg;
    user.eye_color = eye_color || user.eye_color;
    user.marital_status = marital_status || user.marital_status;
    user.father_name = father_name || user.father_name;
    user.home_address = home_address || user.home_address;

    user.passport = {
        number: passport_number || user.passport?.number || '',
        issue_date: passport_issue_date || user.passport?.issue_date || '',
        expiry_date: passport_expiry_date || user.passport?.expiry_date || '',
        place_of_issue: passport_place_of_issue || user.passport?.place_of_issue || '',
        issued_by: passport_issued_by || user.passport?.issued_by || ''
    };

    user.seaman_book = {
        number: seaman_book_number || user.seaman_book?.number || '',
        issue_date: seaman_book_issue_date || user.seaman_book?.issue_date || '',
        expiry_date: seaman_book_expiry_date || user.seaman_book?.expiry_date || '',
        issued_by: seaman_book_issued_by || user.seaman_book?.issued_by || ''
    };

    // Update Medical Certificates
    user.medical_cert = {
        has_medical: has_medical === 'on',
        medical: has_medical === 'on' ? {
            certificate_number: med_certificate_number || '',
            issued_by: med_issued_by || '',
            issue_date: med_issue_date || '',
            expiry_date: med_expiry_date || ''
        } : null,
        has_yellow_fever: has_yellow_fever === 'on',
        yellow_fever: has_yellow_fever === 'on' ? {
            certificate_number: yf_certificate_number || '',
            issued_by: yf_issued_by || '',
            issue_date: yf_issue_date || '',
            expiry_date: yf_expiry_date || ''
        } : null
    };

    // Handle adding new experience
    if (req.body.new_exp_company_name && req.body.new_exp_vessel_name) {
        const newExp = {
            company_name: req.body.new_exp_company_name,
            vessel_name: req.body.new_exp_vessel_name,
            type: req.body.new_exp_type,
            rank: req.body.new_exp_rank,
            sign_on: req.body.new_exp_sign_on,
            sign_off: req.body.new_exp_sign_off,
            months: Math.round((new Date(req.body.new_exp_sign_off) - new Date(req.body.new_exp_sign_on)) / (1000 * 60 * 60 * 24 * 30))
        };
        user.experiences.push(newExp);
    }

    // Handle adding new certificate
    if (req.body.new_cert_name && req.body.new_cert_certificate_no) {
        const newCert = {
            name: req.body.new_cert_name,
            certificate_no: req.body.new_cert_certificate_no,
            issued_by: req.body.new_cert_issued_by,
            issue_date: req.body.new_cert_issue_date,
            expiry_date: req.body.new_cert_expiry_date
        };
        user.certificates.push(newCert);
    }

    // Handle adding new licence
    if (req.body.new_lic_type && req.body.new_lic_name) {
        const newLic = {
            type: req.body.new_lic_type,
            name: req.body.new_lic_name,
            number: req.body.new_lic_number,
            grade: req.body.new_lic_grade,
            issue_date: req.body.new_lic_issue_date,
            expiry_date: req.body.new_lic_expiry_date,
            issued_place: req.body.new_lic_issued_place,
            issued_by: req.body.new_lic_issued_by
        };
        user.licences.push(newLic);
    }

    req.session.user = user;
    res.send('<script>alert("Profile updated!"); window.location.href="/dashboard";</script>');
});

app.get('/experience/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('add-experience', { user: req.session.user });
});

app.post('/experience/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  const { company_name, vessel_name, type, rank, sign_on, sign_off } = req.body;

  if (!company_name || !vessel_name || !type || !rank || !sign_on || !sign_off) {
    return res.send('<script>alert("Please fill all experience details"); window.location.href="/experience/add";</script>');
  }

  if (new Date(sign_off) <= new Date(sign_on)) {
    return res.send('<script>alert("Sign off date must be after sign on date"); window.location.href="/experience/add";</script>');
  }

  // Check for overlapping dates with existing experiences
  for (const exp of user.experiences) {
    const existingStart = new Date(exp.sign_on);
    const existingEnd = new Date(exp.sign_off);
    const newStart = new Date(sign_on);
    const newEnd = new Date(sign_off);

    if (!(newEnd <= existingStart || newStart >= existingEnd)) {
      return res.send('<script>alert("Experience dates conflict with an existing experience"); window.location.href="/experience/add";</script>');
    }
  }

  // Calculate months
  const diffTime = new Date(sign_off) - new Date(sign_on);
  const months = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));

  user.experiences.push({
    company_name,
    vessel_name,
    type,
    rank,
    sign_on,
    sign_off,
    months
  });

  req.session.user = user;
  res.send('<script>alert("Experience added!"); window.location.href="/dashboard";</script>');
});

app.get('/certificate/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('add-certificate', { user: req.session.user });
});

app.post('/certificate/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  const { name, certificate_no, issue_date, expiry_date, issued_by } = req.body;

  if (!name || !certificate_no || !issue_date || !expiry_date || !issued_by) {
    return res.send('<script>alert("Please fill all certificate details"); window.location.href="/certificate/add";</script>');
  }

  if (new Date(expiry_date) <= new Date(issue_date)) {
    return res.send('<script>alert("Expiry date must be after issue date"); window.location.href="/certificate/add";</script>');
  }

  user.certificates.push({ name, certificate_no, issue_date, expiry_date, issued_by });
  req.session.user = user;
  res.send('<script>alert("Certificate added!"); window.location.href="/dashboard";</script>');
});

app.get('/licence/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('add-licence', { user: req.session.user });
});

app.post('/licence/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  const { type, name, number, grade, issue_date, expiry_date, issued_place, issued_by } = req.body;

  if (!type || !name || !number || !issue_date || !expiry_date || !issued_place || !issued_by) {
    return res.send('<script>alert("Please fill all licence details"); window.location.href="/licence/add";</script>');
  }

  user.licences.push({ type, name, number, grade, issue_date, expiry_date, issued_place, issued_by });
  req.session.user = user;
  res.send('<script>alert("Licence added!"); window.location.href="/dashboard";</script>');
});

app.get('/medical/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('add-medical', { user: req.session.user });
});

app.post('/medical/add', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  const {
    has_medical,
    medical_certificate_number,
    medical_issued_by,
    medical_issue_date,
    medical_expiry_date,
    has_yellow_fever,
    yf_certificate_number,
    yf_issued_by,
    yf_issue_date,
    yf_expiry_date
  } = req.body;

  user.medical_cert = {
    has_medical: has_medical === 'on',
    medical: has_medical === 'on' ? {
      certificate_number: medical_certificate_number,
      issued_by: medical_issued_by,
      issue_date: medical_issue_date,
      expiry_date: medical_expiry_date
    } : null,
    has_yellow_fever: has_yellow_fever === 'on',
    yellow_fever: has_yellow_fever === 'on' ? {
      certificate_number: yf_certificate_number,
      issued_by: yf_issued_by,
      issue_date: yf_issue_date,
      expiry_date: yf_expiry_date
    } : null
  };

  req.session.user = user;
  res.send('<script>alert("Medical certificates updated!"); window.location.href="/dashboard";</script>');
});

console.log('Sample user: sample@example.com / Sample123');
console.log('Admin login: admin / admin');

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
