export type SupportedLanguage = 'en' | 'ha' | 'yo' | 'ig' | 'pcm';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  pilotBadge: string;
  roles: {
    technician: string;
    operator: string;
    admin: string;
    regulator: string;
    funder: string;
  };
  nav: {
    home: string;
    log: string;
    cylinders: string;
    payouts: string;
    queue: string;
    verify: string;
    dispatch: string;
    overview: string;
    technicians: string;
    payments: string;
    reports: string;
    profile: string;
    offlineBadge: string;
  };
  recovery: {
    logTitle: string;
    equipmentType: string;
    refrigerantType: string;
    estimatedKg: string;
    location: string;
    locationHint: string;
    takePhotos: string;
    cylinderPhoto: string;
    equipmentPhoto: string;
    submitOnline: string;
    savedOffline: string;
    successLogged: string;
    ineligibleNotice: string;
  };
  verify: {
    verifyTitle: string;
    calibratedWeight: string;
    confirmGas: string;
    identifierResult: string;
    rejectButton: string;
    verifyButton: string;
    rejectReasonPrompt: string;
    varianceWarning: string;
  };
  payout: {
    pendingStatus: string;
    paidStatus: string;
    paidAfterVerification: string;
    ratePerKg: string;
    transferRef: string;
    downloadReceipt: string;
  };
  honestDisclaimer: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'CoolCredit',
    tagline: 'Recover Refrigerant. Protect the Ozone. Get Paid.',
    pilotBadge: 'Lokoja Pilot Operations (Unapproved Proposal Stage)',
    roles: {
      technician: 'RAC Technician',
      operator: 'Collection Point Operator',
      admin: 'Programme Admin',
      regulator: 'Regulator (Read-Only)',
      funder: 'Funder / Partner (Read-Only)',
    },
    nav: {
      home: 'Home',
      log: 'Log Gas',
      cylinders: 'Cylinders',
      payouts: 'Payouts',
      queue: 'Queue',
      verify: 'Verify',
      dispatch: 'Dispatch',
      overview: 'Overview',
      technicians: 'Technicians',
      payments: 'Payments',
      reports: 'Reports',
      profile: 'Profile',
      offlineBadge: 'offline queued',
    },
    recovery: {
      logTitle: 'Log Used Refrigerant Recovery',
      equipmentType: 'Equipment Serviced',
      refrigerantType: 'Refrigerant Type',
      estimatedKg: 'Estimated Quantity (kg)',
      location: 'Workshop / Job Location',
      locationHint: 'GPS is recorded automatically if permitted.',
      takePhotos: 'Attach Photographs',
      cylinderPhoto: 'Recovery Cylinder Photo',
      equipmentPhoto: 'Equipment Nameplate / Job Photo',
      submitOnline: 'Submit Recovery',
      savedOffline: 'Saved offline. Will sync automatically when connected.',
      successLogged: 'Recovery logged successfully. Ready for collection point.',
      ineligibleNotice: 'Your account is pending certification approval. You can view records but cannot log recoveries yet.',
    },
    verify: {
      verifyTitle: 'Verify Cylinder & Gas Type',
      calibratedWeight: 'Calibrated Net Weight (kg)',
      confirmGas: 'Confirmed Refrigerant Type',
      identifierResult: 'Refrigerant Identifier Test Result',
      rejectButton: 'Reject Cylinder',
      verifyButton: 'Verify & Create Payout',
      rejectReasonPrompt: 'Enter mandatory reason for rejection',
      varianceWarning: 'Weight variance exceeds allowed threshold. Please re-weigh.',
    },
    payout: {
      pendingStatus: 'Payout Pending Verification / Transfer',
      paidStatus: 'Paid',
      paidAfterVerification: 'Paid after verification at collection point',
      ratePerKg: '₦4,500 / kg (Pilot rate)',
      transferRef: 'Transfer Reference',
      downloadReceipt: 'Download Receipt',
    },
    honestDisclaimer: 'Honest Status: Quantro CAC registration in progress. Proposal submitted to NOO; not approved. Rates configurable. No fake payouts or fabricated carbon credits.',
  },
  ha: {
    appName: 'CoolCredit',
    tagline: 'Kwashe Gas Din Sanyi. Kare Sararin Samaniya. Samu Kudinka.',
    pilotBadge: 'Gwajin Lokoja (Shirin da aka mika)',
    roles: {
      technician: 'Kwararren Makanike (RAC)',
      operator: 'Ma’aikacin Cibiyar Karba',
      admin: 'Shugaban Shirin',
      regulator: 'Hukuma Mai Kula (Kallo Kawai)',
      funder: 'Masu Daukar Nauyi (Kallo Kawai)',
    },
    nav: {
      home: 'Gida',
      log: 'Rubuta Gas',
      cylinders: 'Silinda',
      payouts: 'Kudaden Shiga',
      queue: 'Layi',
      verify: 'Tantance',
      dispatch: 'Aika',
      overview: 'Bayanin Duka',
      technicians: 'Masu Gyara',
      payments: 'Biyan Kudi',
      reports: 'Rahotanni',
      profile: 'Bayanina',
      offlineBadge: 'a ajiye a waya',
    },
    recovery: {
      logTitle: 'Rikodin Kwashe Gas',
      equipmentType: 'Nau’in Kayan Aiki',
      refrigerantType: 'Nau’in Gas',
      estimatedKg: 'Kimanin Nauyi (kg)',
      location: 'Wurin da aka yi aiki',
      locationHint: 'Ana daukar GPS ta atomatik idan an ba da izini.',
      takePhotos: 'Dauki Hotuna',
      cylinderPhoto: 'Hoton Silinda',
      equipmentPhoto: 'Hoton Na’ura',
      submitOnline: 'Aika Bayani',
      savedOffline: 'An ajiye a waya. Zai tafi da zarar an samu intanet.',
      successLogged: 'An yi nasarar rubuta gas. Kai shi cibiyar karba.',
      ineligibleNotice: 'Ana jiran tabbatar da takardarku kafin ku fara tura bayani.',
    },
    verify: {
      verifyTitle: 'Tantance Silinda da Gas',
      calibratedWeight: 'Ainahin Nauyi a Sikeli (kg)',
      confirmGas: 'Gas din da na’ura ta gano',
      identifierResult: 'Sakamakon Gwajin Na’ura',
      rejectButton: 'Ki Karba',
      verifyButton: 'Tantance & Kirkiri Biyan Kudi',
      rejectReasonPrompt: 'Dole ne a fadi dalilin kin karba',
      varianceWarning: 'Akwai bambanci mai yawa a nauyin.',
    },
    payout: {
      pendingStatus: 'Ana Jiran Tantancewa / Biyan Kudi',
      paidStatus: 'An Biya',
      paidAfterVerification: 'Ana biya bayan an auna an tabbatar a cibiya',
      ratePerKg: '₦4,500 / kg (Farashin Gwaji)',
      transferRef: 'Lambar Tabbatar da Biyan Kudi',
      downloadReceipt: 'Dauki Rasit',
    },
    honestDisclaimer: 'Gaskiya: Rajistar Quantro CAC na gudana. Ba a riga an amince da shirin a hukumance ba.',
  },
  yo: {
    appName: 'CoolCredit',
    tagline: 'Gba Gaasi Tutu Sile. Daabobo Ayika. Gba Owo Re.',
    pilotBadge: 'Idanwo Lokoja (Ipele Aba ti a fi sile)',
    roles: {
      technician: 'Onise Ero Tutu (RAC)',
      operator: 'Oṣiṣẹ Ibudo Gbigba',
      admin: 'Alakoso Eto',
      regulator: 'Amofin / Olutoju',
      funder: 'Oluranlowo Eto',
    },
    nav: {
      home: 'Ile',
      log: 'Fi Gaasi Sile',
      cylinders: 'Awọn Koto Gaasi',
      payouts: 'Isanwo',
      queue: 'Laini',
      verify: 'Ṣayẹwo',
      dispatch: 'Gbe lọ',
      overview: 'Akopọ',
      technicians: 'Awọn Onise',
      payments: 'Isanwo',
      reports: 'Iroyin',
      profile: 'Profaili',
      offlineBadge: 'ti fipamọ offline',
    },
    recovery: {
      logTitle: 'Akọsilẹ Gbigba Gaasi Tutu',
      equipmentType: 'Iru Ẹrọ Ti A Ṣe',
      refrigerantType: 'Iru Gaasi',
      estimatedKg: 'Iwon Ti A Foju Sun (kg)',
      location: 'Ibi Ti A Ti Ṣiṣẹ',
      locationHint: 'GPS yoo mu ipo rẹ taara ti o ba gba laaye.',
      takePhotos: 'Ya Aworan',
      cylinderPhoto: 'Aworan Koto Gaasi',
      equipmentPhoto: 'Aworan Ẹrọ',
      submitOnline: 'Fi Ranṣẹ',
      savedOffline: 'Ti fipamọ sori foonu. Yoo lọ nigbati intanẹẹti ba de.',
      successLogged: 'Akọsilẹ ti yege. Gbe lọ si ibudo gbigba.',
      ineligibleNotice: 'A n duro de ifọwọsi ijẹrisi rẹ ṣaaju ki o to le fi gaasi sile.',
    },
    verify: {
      verifyTitle: 'Ṣayẹwo Koto ati Iru Gaasi',
      calibratedWeight: 'Iwon Lori Wọn (kg)',
      confirmGas: 'Iru Gaasi Ti A Fi Ẹrọ Mọ',
      identifierResult: 'Esi Ayẹwo Gaasi',
      rejectButton: 'Kọ Koto Naa',
      verifyButton: 'Ṣayẹwo & Ṣẹda Isanwo',
      rejectReasonPrompt: 'Kọ idi ti a fi kọ koto yii',
      varianceWarning: 'Iyatọ iwon ga ju bi a ti reti lọ.',
    },
    payout: {
      pendingStatus: 'Isanwo N Duro De Ayẹwo',
      paidStatus: 'Ti San',
      paidAfterVerification: 'A o san lẹhin ayẹwo ni ibudo',
      ratePerKg: '₦4,500 / kg (Owo Idanwo)',
      transferRef: 'Nomba Isanwo Banki',
      downloadReceipt: 'Gba Rasiti',
    },
    honestDisclaimer: 'Otitọ: Iforukọsilẹ CAC Quantro n lọ lọwọ. A ti fi aba ranṣẹ ṣugbọn a ko ti gba aṣẹ ni ifowosi.',
  },
  ig: {
    appName: 'CoolCredit',
    tagline: 'Nweta Gas Oyi. Chekwa Mpaghara Anyi. Nweta Ego Gi.',
    pilotBadge: 'Nnwale Lokoja (Nkwadebe Ntinye Akwukwo)',
    roles: {
      technician: 'Onye Ọrụ Igwe Oyi (RAC)',
      operator: 'Onye Ọrụ Ebe Nchịkọta',
      admin: 'Onye Nlekọta Mmemme',
      regulator: 'Ndị Na-achịkwa (Naanị Ịgụ)',
      funder: 'Ndị Nkwado (Naanị Ịgụ)',
    },
    nav: {
      home: 'Ụlọ',
      log: 'Denye Gas',
      cylinders: 'Silinda Gas',
      payouts: 'Ụgwọ E Nwetara',
      queue: 'Ahịrị',
      verify: 'Nyochaa',
      dispatch: 'Ziga',
      overview: 'Nchịkọta',
      technicians: 'Ndị Ọrụ',
      payments: 'Ịkwụ Ụgwọ',
      reports: 'Akụkọ',
      profile: 'Profaịlụ',
      offlineBadge: 'echekwara na ekwentị',
    },
    recovery: {
      logTitle: 'Ndebanye Nchịkọta Gas Oyi',
      equipmentType: 'Ụdị Ngwa E Meziri',
      refrigerantType: 'Ụdị Gas Oyi',
      estimatedKg: 'Ihe Dị Ka Ibu Ya (kg)',
      location: 'Ebe Emere Ọrụ',
      locationHint: 'GPS ga-edepụta ebe ị nọ ma ọ bụrụ na i nye ikike.',
      takePhotos: 'Foto Ngwa Ọrụ',
      cylinderPhoto: 'Foto Silinda Gas',
      equipmentPhoto: 'Foto Ngwa Igwe',
      submitOnline: 'Zipu Ihe E Dere',
      savedOffline: 'Echekwara na ekwentị. Ọ ga-ezipụ mgbe netwọk batara.',
      successLogged: 'Edebanyela gas nke ọma. Kpọga ya n’ebe nchịkọta.',
      ineligibleNotice: 'A ka na-eche nkwado asambodo gị tupu ị bido idenye gas.',
    },
    verify: {
      verifyTitle: 'Nyochaa Silinda na Gas',
      calibratedWeight: 'Ezigbo Ibu na Ngwa Ihe (kg)',
      confirmGas: 'Ụdị Gas E Ji Ngwa Mmata Chọpụta',
      identifierResult: 'Nsonaazụ Nnwale Gas',
      rejectButton: 'Jụ Silinda',
      verifyButton: 'Nyochaa & Mepụta Ụgwọ',
      rejectReasonPrompt: 'Nye ezigbo ihe kpatara e ji jụ ya',
      varianceWarning: 'Ọdịiche dị n’ibu ahụ karịrị oke.',
    },
    payout: {
      pendingStatus: 'A Ka Na-eche Nkwado / Nzipu Ego',
      paidStatus: 'A Kwụọla',
      paidAfterVerification: 'A ga-akwụ ụgwọ mgbe enyochara ya n’ebe nchịkọta',
      ratePerKg: '₦4,500 / kg (Ọnụahịa Nnwale)',
      transferRef: 'Nọmba Nzipu Banki',
      downloadReceipt: 'Budata Akwụkwọ Ụgwọ',
    },
    honestDisclaimer: 'Eziokwu: Ndebanye aha CAC Quantro na-aga n’ihu. E tinyela akwụkwọ na NOO mana akwadobeghị ya.',
  },
  pcm: {
    appName: 'CoolCredit',
    tagline: 'Recover AC Gas. Protect Ozone. Collect Your Sharp Cash.',
    pilotBadge: 'Lokoja Pilot (Proposal Stage, Never Approved Yet)',
    roles: {
      technician: 'RAC Technician',
      operator: 'Collection Point Officer',
      admin: 'Programme Oga',
      regulator: 'Government Eye (Read-Only)',
      funder: 'Donor / Sponsor (Read-Only)',
    },
    nav: {
      home: 'Home',
      log: 'Log Gas',
      cylinders: 'Cylinders',
      payouts: 'My Money',
      queue: 'Queue',
      verify: 'Check Am',
      dispatch: 'Dispatch',
      overview: 'Summary',
      technicians: 'Technicians',
      payments: 'Pay Money',
      reports: 'Reports',
      profile: 'My Profile',
      offlineBadge: 'dey phone',
    },
    recovery: {
      logTitle: 'Log Refrigerant Wey You Recover',
      equipmentType: 'Which Machine You Work?',
      refrigerantType: 'Which Gas Type?',
      estimatedKg: 'How Many Kg You Estimate?',
      location: 'Where You Do The Work?',
      locationHint: 'GPS go pick your location sharp sharp if you gree.',
      takePhotos: 'Snap Photos',
      cylinderPhoto: 'Snap The Cylinder',
      equipmentPhoto: 'Snap The Machine Nameplate',
      submitOnline: 'Submit Now',
      savedOffline: 'E don save for phone. Once network show, e go enter.',
      successLogged: 'You don log am successfully! Carry am go collection point.',
      ineligibleNotice: 'Admin never approve your certificate yet. Once dem approve am, you go fit log gas.',
    },
    verify: {
      verifyTitle: 'Weigh Cylinder & Check Gas',
      calibratedWeight: 'Scale Net Weight (kg)',
      confirmGas: 'Gas Type Machine Confirm',
      identifierResult: 'Tester Result',
      rejectButton: 'Reject Am',
      verifyButton: 'Confirm & Create Payout',
      rejectReasonPrompt: 'Write why you reject this cylinder',
      varianceWarning: 'The weight difference too much pass normal!',
    },
    payout: {
      pendingStatus: 'Money Dey Wait Verification / Bank Transfer',
      paidStatus: 'Money Don Enter',
      paidAfterVerification: 'We go pay after dem weigh and test am for collection point',
      ratePerKg: '₦4,500 / kg (Pilot Price)',
      transferRef: 'Bank Transfer Ref',
      downloadReceipt: 'Download Receipt',
    },
    honestDisclaimer: 'Real Talk: Quantro CAC registration still dey process. Proposal don reach NOO, but dem never approve am yet. No fake numbers.',
  },
};

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
  pcm: 'Pidgin',
};
