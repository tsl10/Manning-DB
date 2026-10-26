require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || `${appUrl}/auth/google/callback`;
const googleAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be configured in production.');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use(passport.initialize());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const uploadProfilePhoto = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, WEBP) are allowed for profile photos.'));
    }
  }
});

const uploadCV = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname || mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for CV.'));
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
    google_id: null,
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
    },
    profile_photo: null,
    cv_file: null
  }
];

function createUserAccount({ fname, lname = '', email, password = null, googleId = null }) {
  return {
    user_id: mockUsers.reduce((largestId, user) => Math.max(largestId, user.user_id), 0) + 1,
    fname,
    lname,
    email,
    date_available: googleId ? '' : '2026-06-01',
    rank: googleId ? '' : 'Deck Cadet',
    department: googleId ? '' : 'Deck',
    phone_number: '',
    password,
    google_id: googleId,
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
    medical_cert: { has_medical: false, medical: null, has_yellow_fever: false, yellow_fever: null },
    profile_photo: null,
    cv_file: null
  };
}

if (googleAuthEnabled) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackUrl,
    state: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.find((entry) => entry.value)?.value?.trim().toLowerCase();
      if (!email || profile._json?.email_verified !== true) {
        return done(null, false);
      }

      let user = mockUsers.find((entry) => entry.google_id === profile.id);
      if (user) {
        return done(null, user);
      }
      if (req.session.googleAuthMode !== 'register') {
        return done(null, false, { message: 'google_account_not_found' });
      }

      user = mockUsers.find((entry) => entry.email.toLowerCase() === email);
      if (user?.google_id && user.google_id !== profile.id) {
        return done(null, false, { message: 'google_account_conflict' });
      }

      if (user) {
        user.google_id = profile.id;
      } else {
        const givenName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Seafarer';
        const familyName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
        user = createUserAccount({
          fname: givenName,
          lname: familyName,
          email,
          googleId: profile.id
        });
        mockUsers.push(user);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
}

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  const loginMessages = {
    google_not_configured: 'Google sign-in is not configured on this server.',
    google_auth_failed: 'Google sign-in failed. Please try again or use your email and password.',
    google_account_not_found: 'No account is linked to this Google account yet. Create an account first.'
  };
  res.render('login', {
    user: req.session.user,
    googleAuthEnabled,
    googleError: loginMessages[req.query.error] || ''
  });
});

app.get('/register', (req, res) => {
  const registrationMessages = {
    google_not_configured: 'Google sign-in is not configured on this server.',
    google_auth_failed: 'Google account creation failed. Please try again.',
    google_account_conflict: 'This email is already linked to a different Google account. Sign in with your existing method.'
  };
  res.render('register', {
    user: req.session.user,
    googleAuthEnabled,
    googleError: registrationMessages[req.query.error] || ''
  });
});

app.get('/auth/google', (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.redirect('/login?error=google_not_configured');
  }
  req.session.googleAuthMode = req.query.mode === 'register' ? 'register' : 'login';
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.redirect('/login?error=google_not_configured');
  }

  const mode = req.session.googleAuthMode === 'register' ? 'register' : 'login';
  passport.authenticate('google', { session: false }, (error, user, info) => {
    if (error) {
      console.error('Google sign-in failed:', error);
      delete req.session.googleAuthMode;
      return res.redirect(`/${mode}?error=google_auth_failed`);
    }
    if (!user) {
      delete req.session.googleAuthMode;
      if (info?.message === 'google_account_not_found') {
        return res.redirect('/login?error=google_account_not_found');
      }
      if (info?.message === 'google_account_conflict') {
        return res.redirect('/register?error=google_account_conflict');
      }
      return res.redirect(`/${mode}?error=google_auth_failed`);
    }

    delete req.session.googleAuthMode;
    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error('Unable to create user session:', sessionError);
        return res.status(500).send('Unable to sign in right now. Please try again.');
      }
      req.session.user = user;
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

app.post('/register', async (req, res) => {
  try {
    const { fname, email, pass } = req.body;

    if (typeof fname !== 'string' || !fname.trim() || typeof email !== 'string' || !email.trim() || typeof pass !== 'string' || !pass) {
      return res.send('<script>alert("Please fill all fields"); window.location.href="/register";</script>');
    }
    if (pass.length < 8) {
      return res.send('<script>alert("Password must be at least 8 characters"); window.location.href="/register";</script>');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return res.send('<script>alert("Email already exists!"); window.location.href="/";</script>');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const names = fname.trim().split(/\s+/);
    const newUser = createUserAccount({
      fname: names.shift(),
      lname: names.join(' '),
      email: normalizedEmail,
      password: hashedPassword
    });
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

    const user = mockUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.send('<script>alert("Email not found!"); window.location.href="/login";</script>');
    }

    if (!user.password) {
      return res.send('<script>alert("Please sign in with Google or set a password in Password Settings."); window.location.href="/login";</script>');
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);
    if (!passwordMatch) {
      return res.send('<script>alert("Incorrect password!"); window.location.href="/login";</script>');
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error('Unable to create user session:', error);
        return res.status(500).send('Unable to sign in right now. Please try again.');
      }
      req.session.user = user;
      return res.redirect('/dashboard');
    });
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

// Admin - View Crew Member Details
app.get('/admin/crew/:id', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const user = mockUsers.find(u => u.user_id === parseInt(req.params.id));
  if (!user) {
    return res.send('<script>alert("Crew member not found!"); window.location.href="/admin/dashboard";</script>');
  }

  res.render('admin-crew-detail', { admin: req.session.admin, user: user });
});

// Admin - Edit Crew Member (Show Form)
app.get('/admin/crew/:id/edit', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const user = mockUsers.find(u => u.user_id === parseInt(req.params.id));
  if (!user) {
    return res.send('<script>alert("Crew member not found!"); window.location.href="/admin/dashboard";</script>');
  }

  res.render('admin-crew-edit', { admin: req.session.admin, user: user });
});

// Admin - Edit Crew Member (Process Form)
app.post('/admin/crew/:id/edit', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const user = mockUsers.find(u => u.user_id === parseInt(req.params.id));
  if (!user) {
    return res.send('<script>alert("Crew member not found!"); window.location.href="/admin/dashboard";</script>');
  }

  const {
    fname, lname, email, phone_number, department, rank, date_available,
    date_of_birth, place_of_birth, nationality, gender, height_cm, weight_kg,
    eye_color, marital_status, father_name, home_address,
    passport_number, passport_issue_date, passport_expiry_date, passport_place_of_issue, passport_issued_by,
    seaman_book_number, seaman_book_issue_date, seaman_book_expiry_date, seaman_book_issued_by
  } = req.body;

  // Update user object
  user.fname = fname || user.fname;
  user.lname = lname || user.lname;
  user.email = email || user.email;
  user.phone_number = phone_number || user.phone_number;
  user.department = department || user.department;
  user.rank = rank || user.rank;
  user.date_available = date_available || user.date_available;
  user.date_of_birth = date_of_birth || user.date_of_birth;
  user.place_of_birth = place_of_birth || user.place_of_birth;
  user.nationality = nationality || user.nationality;
  user.gender = gender || user.gender;
  user.height_cm = height_cm || user.height_cm;
  user.weight_kg = weight_kg || user.weight_kg;
  user.eye_color = eye_color || user.eye_color;
  user.marital_status = marital_status || user.marital_status;
  user.father_name = father_name || user.father_name;
  user.home_address = home_address || user.home_address;

  // Update passport info
  if (passport_number) {
    user.passport.number = passport_number;
    user.passport.issue_date = passport_issue_date;
    user.passport.expiry_date = passport_expiry_date;
    user.passport.place_of_issue = passport_place_of_issue;
    user.passport.issued_by = passport_issued_by;
  }

  // Update seaman book info
  if (seaman_book_number) {
    user.seaman_book.number = seaman_book_number;
    user.seaman_book.issue_date = seaman_book_issue_date;
    user.seaman_book.expiry_date = seaman_book_expiry_date;
    user.seaman_book.issued_by = seaman_book_issued_by;
  }

  res.send('<script>alert("Crew member updated successfully!"); window.location.href="/admin/crew/<%= user.user_id %>";</script>'.replace('<%= user.user_id %>', user.user_id));
});

// Admin - Delete Crew Member
app.get('/admin/crew/:id/delete', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin/login');
  }

  const userIndex = mockUsers.findIndex(u => u.user_id === parseInt(req.params.id));
  if (userIndex === -1) {
    return res.send('<script>alert("Crew member not found!"); window.location.href="/admin/dashboard";</script>');
  }

  mockUsers.splice(userIndex, 1);
  res.send('<script>alert("Crew member deleted successfully!"); window.location.href="/admin/dashboard";</script>');
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

app.get('/profile/password', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const statusMessages = {
    updated: 'Your password has been updated.',
    invalid_current: 'Your current password is incorrect.',
    mismatch: 'The new passwords do not match.',
    too_short: 'Your new password must be at least 8 characters.',
    error: 'Unable to update your password right now. Please try again.'
  };
  res.render('change-password', {
    user: req.session.user,
    hasPassword: Boolean(req.session.user.password),
    message: Object.prototype.hasOwnProperty.call(statusMessages, req.query.status)
      ? statusMessages[req.query.status]
      : ''
  });
});

app.post('/profile/password', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find((entry) => entry.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  const confirmPassword = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

  try {
    if (user.password && !await bcrypt.compare(currentPassword, user.password)) {
      return res.redirect('/profile/password?status=invalid_current');
    }
    if (newPassword.length < 8) {
      return res.redirect('/profile/password?status=too_short');
    }
    if (newPassword !== confirmPassword) {
      return res.redirect('/profile/password?status=mismatch');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    req.session.user = user;
    return res.redirect('/profile/password?status=updated');
  } catch (error) {
    console.error('Password update failed:', error);
    return res.redirect('/profile/password?status=error');
  }
});

app.post('/profile/edit', uploadProfilePhoto.single('profile_photo'), (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
    if (!user) {
        return res.redirect('/login');
    }

    // Handle profile photo upload
    if (req.file) {
        user.profile_photo = '/uploads/' + req.file.filename;
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

    const parseDate = (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (date_of_birth) {
        const dob = parseDate(date_of_birth);
        if (!dob) {
            return res.send('<script>alert("Invalid date of birth"); window.location.href="/profile/edit";</script>');
        }
        if (dob > todayDate) {
            return res.send('<script>alert("Date of birth cannot be in the future"); window.location.href="/profile/edit";</script>');
        }
        let age = todayDate.getFullYear() - dob.getFullYear();
        const m = todayDate.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < dob.getDate())) age--;
        if (age < 18) {
            return res.send('<script>alert("You must be at least 18 years old"); window.location.href="/profile/edit";</script>');
        }
    }

    const dateAvailable = parseDate(date_available);
    if (date_available) {
        if (!dateAvailable) {
            return res.send('<script>alert("Invalid date available"); window.location.href="/profile/edit";</script>');
        }
        if (dateAvailable <= todayDate) {
            return res.send('<script>alert("Date available must be in the future"); window.location.href="/profile/edit";</script>');
        }
    }

    const passportIssueDate = parseDate(passport_issue_date || user.passport?.issue_date);
    const passportExpiryDate = parseDate(passport_expiry_date || user.passport?.expiry_date);
    if (passportIssueDate) {
        if (passportIssueDate > todayDate) {
            return res.send('<script>alert("Passport issue date cannot be in the future"); window.location.href="/profile/edit";</script>');
        }
    }
    if (passportIssueDate && passportExpiryDate) {
        if (passportExpiryDate <= passportIssueDate) {
            return res.send('<script>alert("Passport expiry date must be after passport issue date"); window.location.href="/profile/edit";</script>');
        }
        const expectedPassportExpiry = new Date(passportIssueDate);
        expectedPassportExpiry.setFullYear(expectedPassportExpiry.getFullYear() + 10);
        if (passportExpiryDate.getTime() !== expectedPassportExpiry.getTime()) {
            return res.send('<script>alert("Passport validity must be 10 years from the issue date"); window.location.href="/profile/edit";</script>');
        }
    }

    const seamanIssueDate = parseDate(seaman_book_issue_date || user.seaman_book?.issue_date);
    const seamanExpiryDate = parseDate(seaman_book_expiry_date || user.seaman_book?.expiry_date);
    if (seamanIssueDate) {
        if (seamanIssueDate > todayDate) {
            return res.send('<script>alert("Seaman book issue date cannot be in the future"); window.location.href="/profile/edit";</script>');
        }
    }
    if (seamanIssueDate && seamanExpiryDate) {
        if (seamanExpiryDate <= seamanIssueDate) {
            return res.send('<script>alert("Seaman book expiry date must be after seaman book issue date"); window.location.href="/profile/edit";</script>');
        }
        const expectedSeamanExpiry = new Date(seamanIssueDate);
        expectedSeamanExpiry.setFullYear(expectedSeamanExpiry.getFullYear() + 10);
        if (seamanExpiryDate.getTime() !== expectedSeamanExpiry.getTime()) {
            return res.send('<script>alert("Seaman book validity must be 10 years from the issue date"); window.location.href="/profile/edit";</script>');
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

// Upload CV
app.post('/upload-cv', uploadCV.single('cv_file'), (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  if (req.file) {
    user.cv_file = '/uploads/' + req.file.filename;
    req.session.user = user;
  }

  res.send('<script>alert("CV uploaded successfully!"); window.location.href="/dashboard";</script>');
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

// Generate CV as PDF
app.get('/generate-cv', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = mockUsers.find(u => u.user_id === req.session.user.user_id);
  if (!user) {
    return res.redirect('/login');
  }

  const PDFDocument = require('pdfkit');
  const path = require('path');
  
  // Create PDF document with A4 size and margins
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 40,
    bufferPages: true
  });
  const filename = `${user.fname}_${user.lname}_CV.pdf`;
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  
  doc.pipe(res);

  // Helper function to draw section headers
  const drawSectionHeader = (title) => {
    doc
      .fillColor('#1f2937')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(title, { align: 'left' })
      .moveDown(0.3)
      .strokeColor('#3b82f6')
      .lineWidth(2)
      .moveTo(40, doc.y)
      .lineTo(doc.page.width - 40, doc.y)
      .stroke()
      .moveDown(0.8);
  };

  // Helper function to draw a field label and value
  const drawField = (label, value, indent = 0) => {
    doc
      .fillColor('#4b5563')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`${label}:`, { indent, continued: true })
      .fillColor('#111827')
      .font('Helvetica')
      .text(` ${value || 'N/A'}`);
  };

  // --- Page 1: Header and Personal Info ---
  
  // Header: Company Logo (placeholder) and Title
  doc
    .fillColor('#0f172a')
    .fontSize(26)
    .font('Helvetica-Bold')
    .text('CREW CURRICULUM VITAE', { align: 'center' })
    .moveDown(0.5)
    .fontSize(12)
    .font('Helvetica')
    .text('KAMI MARINE', { align: 'center' })
    .moveDown(1.5);

  // Applicant Name and Position
  doc
    .fillColor('#1f2937')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(`${user.fname} ${user.lname}`, { align: 'center' })
    .moveDown(0.3)
    .fontSize(12)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(`${user.department || ''} - ${user.rank || ''}`, { align: 'center' })
    .moveDown(1);

  // Contact Information
  doc
    .fillColor('#111827')
    .fontSize(10)
    .font('Helvetica')
    .text(`Email: ${user.email || 'N/A'}`, { align: 'center' })
    .text(`Phone: ${user.phone_number || 'N/A'}`, { align: 'center' })
    .text(`Date Available: ${user.date_available || 'N/A'}`, { align: 'center' })
    .moveDown(1.5);

  // Section 1: Personal Details
  drawSectionHeader('1. PERSONAL DETAILS');
  drawField('Full Name', `${user.fname} ${user.lname}`);
  drawField('Date of Birth', user.date_of_birth);
  drawField('Place of Birth', user.place_of_birth);
  drawField('Nationality', user.nationality);
  drawField('Gender', user.gender);
  drawField('Marital Status', user.marital_status);
  drawField('Height', user.height_cm ? `${user.height_cm} cm` : '');
  drawField('Weight', user.weight_kg ? `${user.weight_kg} kg` : '');
  drawField('Eye Color', user.eye_color);
  drawField("Father's Name", user.father_name);
  doc.moveDown(0.5);
  drawField('Home Address', user.home_address);
  doc.moveDown(1);

  // Section 2: Passport Information
  drawSectionHeader('2. PASSPORT INFORMATION');
  if (user.passport) {
    drawField('Passport Number', user.passport.number);
    drawField('Date of Issue', user.passport.issue_date);
    drawField('Date of Expiry', user.passport.expiry_date);
    drawField('Place of Issue', user.passport.place_of_issue);
    drawField('Issued By', user.passport.issued_by);
  }
  doc.moveDown(1);

  // Section 3: Seaman Book
  drawSectionHeader('3. SEAMAN BOOK');
  if (user.seaman_book) {
    drawField('Seaman Book Number', user.seaman_book.number);
    drawField('Date of Issue', user.seaman_book.issue_date);
    drawField('Date of Expiry', user.seaman_book.expiry_date);
    drawField('Issued By', user.seaman_book.issued_by);
  }
  doc.moveDown(1);

  // --- Page 2 (if needed): Experience ---
  doc.addPage();

  // Section 4: Sea Service Experience
  drawSectionHeader('4. SEA SERVICE EXPERIENCE');
  if (user.experiences && user.experiences.length > 0) {
    user.experiences.forEach((exp, index) => {
      doc
        .fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Experience ${index + 1}:`, { continued: true })
        .fillColor('#111827')
        .text(` ${exp.vessel_name || ''}`)
        .moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica');
      drawField('Company Name', exp.company_name, 20);
      drawField('Vessel Type', exp.type, 20);
      drawField('Rank', exp.rank, 20);
      drawField('Sign On Date', exp.sign_on, 20);
      drawField('Sign Off Date', exp.sign_off, 20);
      drawField('Duration', exp.months ? `${exp.months} months` : '', 20);
      doc.moveDown(0.5);
    });
    
    // Calculate total experience
    let totalMonths = user.experiences.reduce((sum, exp) => sum + (parseInt(exp.months) || 0), 0);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    doc
      .fillColor('#0f172a')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Total Sea Service: ${years} years ${months} months`);
  } else {
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No experience added yet.');
  }
  doc.moveDown(1.5);

  // Section 5: Certificates
  drawSectionHeader('5. CERTIFICATES');
  if (user.certificates && user.certificates.length > 0) {
    user.certificates.forEach((cert, index) => {
      doc
        .fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Certificate ${index + 1}: ${cert.name || ''}`)
        .moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica');
      drawField('Certificate Number', cert.certificate_no, 20);
      drawField('Date of Issue', cert.issue_date, 20);
      drawField('Date of Expiry', cert.expiry_date, 20);
      drawField('Issued By', cert.issued_by, 20);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No certificates added yet.');
  }
  doc.moveDown(1.5);

  // --- Page 3 (if needed): Licences and Medical ---
  doc.addPage();

  // Section 6: Licences & Documents
  drawSectionHeader('6. LICENCES & DOCUMENTS');
  if (user.licences && user.licences.length > 0) {
    user.licences.forEach((lic, index) => {
      doc
        .fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Licence ${index + 1}: ${lic.name || ''} (${lic.type || ''})`)
        .moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica');
      drawField('Licence Number', lic.number, 20);
      drawField('Grade', lic.grade, 20);
      drawField('Date of Issue', lic.issue_date, 20);
      drawField('Date of Expiry', lic.expiry_date, 20);
      drawField('Place of Issue', lic.issued_place, 20);
      drawField('Issued By', lic.issued_by, 20);
      doc.moveDown(0.5);
    });
  } else {
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No licences added yet.');
  }
  doc.moveDown(1.5);

  // Section 7: Medical Certificates
  drawSectionHeader('7. MEDICAL CERTIFICATES');
  if (user.medical_cert) {
    if (user.medical_cert.has_medical && user.medical_cert.medical) {
      doc
        .fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Medical & Fitness Certificate')
        .moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica');
      drawField('Certificate Number', user.medical_cert.medical.certificate_number, 20);
      drawField('Issued By', user.medical_cert.medical.issued_by, 20);
      drawField('Date of Issue', user.medical_cert.medical.issue_date, 20);
      drawField('Date of Expiry', user.medical_cert.medical.expiry_date, 20);
      doc.moveDown(0.5);
    }
    
    if (user.medical_cert.has_yellow_fever && user.medical_cert.yellow_fever) {
      doc
        .fillColor('#1f2937')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Yellow Fever Certificate')
        .moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica');
      drawField('Certificate Number', user.medical_cert.yellow_fever.certificate_number, 20);
      drawField('Issued By', user.medical_cert.yellow_fever.issued_by, 20);
      drawField('Date of Issue', user.medical_cert.yellow_fever.issue_date, 20);
      drawField('Date of Expiry', user.medical_cert.yellow_fever.expiry_date, 20);
    }
    
    if (!user.medical_cert.has_medical && !user.medical_cert.has_yellow_fever) {
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No medical certificates added yet.');
    }
  } else {
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280').text('No medical certificates added yet.');
  }

  doc.end();
});

console.log('Sample user: sample@example.com / Sample123');
console.log('Admin login: admin / admin');

app.listen(PORT, () => {
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  console.log(`Server running on ${appUrl}`);
});
