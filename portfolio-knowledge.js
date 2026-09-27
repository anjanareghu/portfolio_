// Verified portfolio knowledge. Page-backed records stay in sync with index.html.
// This is a local, deterministic answer source, not a language-model API.
(() => {
  'use strict';
  const text = (root, selector) => root.querySelector(selector)?.textContent.trim() || '';
  const people = {
    remind: { team: ['Aryan S', 'Alen Sam Das', 'Daewoo Krishna S'], guide: 'Geethumol PV' },
    stellaris: { team: ['Aryan S', 'Alen Sam Das', 'Daewoo Krishna S'], guide: 'Dr. Anju J Prakash' },
    elysia: { team: ['Aryan S', 'Alen Sam Das', 'Daewoo Krishna S'], guide: 'Geethumol PV' },
    dekathon: { team: ['Aryan S', 'Aishwarya Ammal S'] },
  };
  const knowledge = {
    about: {
      name: 'Anjana B', location: 'Alappuzha, Kerala, India',
      summary: 'Anjana is a Computer Science Engineering graduate and IEEE-published researcher. She builds AI/ML and generative AI products with Python, RAG pipelines, and backend APIs.',
      interests: 'Her current focus is applied AI/ML, language-model integration, retrieval-augmented generation, and Python backend development. She is open to AI/ML and software development internships.',
      community: 'She has served as Newsletter Editor at the IEEE Student Branch, Sree Buddha College of Engineering, beginning in February 2025.',
    },
    skills: [...document.querySelectorAll('.toolkit-card')].map(card => ({ area: text(card, 'h3'), technologies: text(card, 'p') })),
    additionalSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'C', 'SQL', 'Java (academic coursework)', 'TensorFlow (familiar)', 'Keras (familiar)', 'Django (familiar)', 'Matplotlib', 'Seaborn'],
    projects: (window.PortfolioProjects || []).map(project => ({
      id: project.id, name: project.name, description: project.summary,
      technologies: project.stack.join(' · '), features: project.features,
      repository: project.repository, href: `projects/${project.slug}.html`, section: 'work', target: '#panel-' + project.id,
    })),
    research: [...document.querySelectorAll('.research-entry')].map(entry => ({
      id: entry.id.replace('paper-', ''), title: text(entry, 'h3'), description: text(entry, '.research-description'),
      venue: text(entry, '.research-meta span:last-child'), year: text(entry, '.research-meta span:first-child').split('/').pop().trim(), role: text(entry, '.research-role'), url: entry.querySelector('.publication-card').href,
    })),
    additionalProjects: [...document.querySelectorAll('.more-projects > a')].map(link => ({ name: text(link, 'strong'), description: text(link, 'small'), repository: link.href })),
    experience: [...document.querySelectorAll('.internship-entry')].map(entry => ({ company: text(entry, 'h3'), role: text(entry, '.internship-role'), date: text(entry, '.internship-date'), description: text(entry, '.internship-description') })),
    education: {
      degree: 'B.Tech in Computer Science and Engineering', college: 'Sree Buddha College of Engineering, Kerala', years: '2022–2026', cgpa: '9.03 / 10',
      school: 'Higher Secondary (Science), RVSM HSS, 2020–2022: 96%. Secondary School, Sree Narayana Central School, 2020.',
    },
    achievements: [...document.querySelectorAll('.recognition-entry')].map(entry => ({
      id: entry.id.replace('recognition-', ''), title: text(entry, 'h3'), organization: text(entry, '.recognition-organization'),
      description: text(entry, '.recognition-description'), story: text(entry, '.recognition-story'),
      publication: entry.querySelector('.recognition-source')?.href || null,
    })),
    // Edunet is verified against the supplied certificate; remaining credentials
    // are listed in Anjana's earlier portfolio, with no dates provided.
    certifications: [
      { name: 'Full Stack Web Development with AI Tools — Next Gen Employability Program (academic year 2025–2026)', issuer: 'Edunet Foundation / EY GDS', section: 'experience' },
      { name: 'AI Skills Passport', issuer: 'EY and Microsoft', url: 'https://drive.google.com/file/d/1BiPmICL16unv1aNMRJXD8ZLg-SpW1abo/view' },
      { name: 'From Learner to Builder: AI Agent Architect', issuer: 'IBM SkillsBuild', url: 'https://drive.google.com/file/d/1cqgmqxHb8suocZsLsl82_jexPdFu_Lin/view' },
      { name: 'Flask Master Class: Beginners to Pro', issuer: 'Udemy', url: 'https://drive.google.com/file/d/11BaIVeHqTxQ2w25QYBPqDayFY9-WohcC/view' },
    ],
    contact: { email: 'anjanareghu202338@gmail.com', linkedin: 'https://www.linkedin.com/in/anjana-b-b0b865204/', github: 'https://github.com/anjanareghu' },
    people,
  };
  const normalize = value => value.toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const action = (label, section, extra = {}) => ({ label, section, ...extra });
  const fallback = () => ({ paragraphs: ["I don't have that information, but you can ask Anjana directly."], actions: [action('Contact Anjana', 'contact')], topic: null });
  const aliases = {
    remind: /\b(remind|neuroweave|connectome|icietsd|stroke|neurological)\b/,
    stellaris: /\b(stellaris(?:ai)?|iccpct|hiring|recruitment)\b/,
    foodsnap: /\b(food ?snap(?:ai)?|nutrition|food recognition)\b/,
    sprintmind: /\b(sprintmind|sprint summary|sprint summaries)\b/,
    'food-d': /\b(food_d|food d|delivery matching|delivery optimization)\b/,
    elysia: /\b(elysia|ekha|ekah|third prize|3rd prize)\b/,
    dekathon: /\b(dekathon|72 hour|indo malaysian)\b/,
    dreamvestor: /\b(dreamvestor|asap|lightweight llm)\b/,
    'ai-insight': /\b(ai ?insight|first prize|1st prize|medical ai assistant)\b/,
  };
  const knownTechnologies = normalize([...knowledge.skills.map(s => s.technologies), ...knowledge.additionalSkills, ...knowledge.projects.map(p => p.technologies)].join(' '));

  function reply(question, context = {}, previousTopic = null) {
    const query = normalize(question);
    if (!query) return fallback();
    // Do not answer unrecorded personal details, metrics, preferences, or motives.
    if (/\b(salary|age|birthday|birth date|married|religion|home address|phone|mobile number|accuracy|benchmark|latency|how much|why did|why does|why choose|why she|favorite|favourite|visa|citizenship|nationality|references|ignore instructions|system prompt|fda|clinically validated|revenue|funding)\b/.test(query)) return fallback();
    if (/certif/.test(query) && /\b(aws|azure|google|oracle|cisco)\b/.test(query)) return fallback();
    const employerQuestion = /\b(?:work(?:ed|s)?|internship|interned|employed|job)\b.*\bat\s+(.+)/.exec(query);
    if (employerQuestion && !/\b(edunet|ey)\b/.test(employerQuestion[1])) return fallback();
    const technologyQuestion = /\b(?:know|use|uses|support|experienced in|work with|built with)\s+([a-z0-9+#.]+)/.exec(query);
    if (technologyQuestion && !['a', 'an', 'the', 'for', 'to', 'it', 'her', 'his', 'this'].includes(technologyQuestion[1]) && !knownTechnologies.split(' ').includes(technologyQuestion[1])) return fallback();
    if (/^(hi|hello|hey|hello there|good morning|good evening)[.! ]*$/.test(query)) return { paragraphs: ["Hello. I can help you explore Anjana's projects, skills, research, and experience. What would you like to know?"], topic: null };
    if (/^(thanks|thank you|thankyou)[.! ]*$/.test(query)) return { paragraphs: ["You're welcome. You can keep exploring her work or get in touch directly."], actions: [action('Contact Anjana', 'contact')], topic: null };

    if (technologyQuestion && knownTechnologies.split(' ').includes(technologyQuestion[1])) {
      const term = technologyQuestion[1];
      const projects = [...knowledge.projects, ...knowledge.additionalProjects].filter(project => normalize(`${project.technologies || ''} ${project.description}`).split(' ').includes(term));
      const skill = [...knowledge.skills.map(item => item.technologies), ...knowledge.additionalSkills].find(item => normalize(item).split(' ').includes(term));
      if (projects.length) return { paragraphs: [`${term === 'react' ? 'React' : term === 'python' ? 'Python' : technologyQuestion[1]} is listed in her project work.`], bullets: projects.map(project => `${project.name} — ${project.technologies || project.description}`), actions: [action('View projects', 'work')], topic: 'skills' };
      if (skill) return { paragraphs: [`Her recorded skills include ${skill}.`], actions: [action('View skills', 'about')], topic: 'skills' };
    }

    let entity = Object.keys(aliases).find(key => aliases[key].test(query));
    if (!entity && /\b(this project|this achievement|this one|it built|how was this)\b/.test(query)) entity = context.entity;
    if (!entity && /^(tell me more|more details|what technologies|what tech stack|who was (her|the) guide|who (was|were) (her|the) team)/.test(query)) entity = previousTopic;
    if (entity && aliases[entity]) {
      const project = knowledge.projects.find(p => p.id === entity);
      const achievement = knowledge.achievements.find(a => a.id === entity);
      if (/\b(team|teammates?|co authors?|guid(?:e|ed|es)|mentors?|gratitude)\b/.test(query)) {
        const credits = people[entity];
        if (!credits || (/\b(guid(?:e|ed|es)|mentors?)\b/.test(query) && !credits.guide)) return fallback();
        return { paragraphs: [`Anjana worked with ${credits.team.join(', ')}.${credits.guide ? ` Their guide was ${credits.guide}.` : ''}`, 'She credits their collaboration and support in bringing the work to life.'], actions: [action('View recognition', 'recognition', { achievement: entity })], topic: entity };
      }
      if (project && !/\b(award|achievement|present|conference|published|publication|paper|prize|story)\b/.test(query)) {
        return { paragraphs: [project.description, `Built with ${project.technologies}.`], bullets: project.features, actions: [{ label: 'Project details', href: project.href }, { label: 'Repository', href: project.repository }], topic: entity };
      }
      if (achievement) return { paragraphs: [achievement.description, achievement.organization], actions: [action('View achievement', 'recognition', { achievement: entity }), ...(achievement.publication ? [{ label: 'Read paper', href: achievement.publication }] : [])], topic: entity };
    }
    if (/\b(sprintmind|food d)\b/.test(query)) {
      const project = knowledge.additionalProjects.find(p => query.includes(normalize(p.name).replace(' ai', '')));
      if (project) return { paragraphs: [`${project.name}: ${project.description}.`], actions: [action('View projects', 'work'), { label: 'Repository', href: project.repository }], topic: null };
    }
    if (/\b(contact|email|reach|linkedin|github|hire|hiring her|available|availability|opportunit\w*)\b/.test(query)) return { paragraphs: [knowledge.about.interests, `Email: ${knowledge.contact.email}`], actions: [action('Contact Anjana', 'contact'), { label: 'LinkedIn', href: knowledge.contact.linkedin }, { label: 'GitHub', href: knowledge.contact.github }], topic: 'contact' };
    if (/\b(education|study|studied|college|degree|graduate|graduated|cgpa|gpa|marks|school|academic|qualification)\b/.test(query) && !/certif/.test(query)) return { paragraphs: [`${knowledge.education.degree}, ${knowledge.education.college} (${knowledge.education.years}). CGPA: ${knowledge.education.cgpa}.`, knowledge.education.school], actions: [action('View education', 'experience', { target: '.education-block' })], topic: 'education' };
    if (/\b(certif\w*|credential\w*|courses?|ibm|udemy|passport)\b/.test(query)) {
      const credentials = /\b(edunet|ey gds|next gen)\b/.test(query) ? knowledge.certifications.filter(c => c.section === 'experience') : knowledge.certifications;
      return { paragraphs: ['Her listed credentials include:'], bullets: credentials.map(c => `${c.name} — ${c.issuer}`), actions: credentials.map(c => c.section ? action('View Edunet certificate', c.section, { target: '.internship-entry' }) : { label: c.issuer, href: c.url }), topic: 'certifications' };
    }
    if (/\b(experience|intern\w*|edunet|ey|career|worked|employment)\b/.test(query)) {
      const selected = knowledge.experience.filter(e => normalize(e.company).split(' ').some(word => word.length > 3 && query.includes(word)));
      if (selected.length === 1) { const e = selected[0]; return { paragraphs: [`${e.role} at ${e.company} — ${e.date}.`, e.description], actions: [action('View experience', 'experience')], topic: 'experience' }; }
      return { paragraphs: ['Her listed experience focuses on full-stack web development with AI tools:'], bullets: knowledge.experience.map(e => `${e.company} — ${e.role} (${e.date})`), actions: [action('View experience', 'experience')], topic: 'experience' };
    }
    if (/\b(publication\w*|paper\w*|research)\b/.test(query)) return { paragraphs: ['Anjana has two IEEE publications:'], bullets: knowledge.research.map(paper => `${paper.title} — ${paper.venue} ${paper.year} (${paper.role}).`), actions: [action('Explore research', 'research'), ...knowledge.research.map(paper => ({ label: paper.title, href: paper.url }))], topic: 'publications' };
    if (/\b(achievement\w*|recognition|award\w*|milestone\w*|competition\w*|hackathon\w*)\b/.test(query)) return { paragraphs: ['A few milestones from her journey:'], bullets: ['First prize — AI Insight 2025 RAG coding competition.', 'Third prize — ELYSIA Project Competition with ReMind.', 'IEEE publications at ICCPCT 2025 and ICIETSD 2026.', 'Dekathon 3.0 and Dreamvestor 2.0 district-level participation.'], actions: [action('Explore recognition', 'recognition')], topic: 'achievements' };
    if (/\b(technolog\w*|skills?|stack|languages?|framework\w*|tools?|python|react|javascript|backend|llm|rag|work with)\b/.test(query)) return { paragraphs: ['Her main focus is Python, applied AI, and backend development.'], bullets: knowledge.skills.map(s => `${s.area}: ${s.technologies}`), actions: [action('View skills', 'about')], topic: 'skills' };
    if (/\b(interests?|focus|passion|goals?|looking for|working on)\b/.test(query)) return { paragraphs: [knowledge.about.interests], actions: [action('Explore her work', 'work'), action('Contact Anjana', 'contact')], topic: 'interests' };
    if (/\b(guid(?:e|ed|es)|mentors?|teammates?|co authors?)\b/.test(query)) return { paragraphs: ['Her research collaborations include:'], bullets: ['Stellaris AI: Aryan S, Alen Sam Das, and Daewoo Krishna S; guided by Dr. Anju J Prakash.', 'ReMind: Aryan S, Alen Sam Das, and Daewoo Krishna S; guided by Geethumol PV.', 'Dekathon 3.0: Aryan S and Aishwarya Ammal S.'], actions: [action('View recognition', 'recognition')], topic: null };
    if (/\b(project\w*|built|builds?|portfolio|developed|work)\b/.test(query)) return { paragraphs: ['Her featured projects connect AI with practical applications:'], bullets: knowledge.projects.map(p => `${p.name} — ${p.description}`), actions: [action('Explore projects', 'work')], topic: 'projects' };
    if (/\b(newsletter|volunteer|leadership|editor)\b/.test(query)) return { paragraphs: [knowledge.about.community], actions: [action('Community experience', 'experience', { target: '#community' })], topic: 'about' };
    if (/\b(who is|about anjana|about her|introduce|background|where is|location|based)\b/.test(query)) return { paragraphs: [knowledge.about.summary, `She is based in ${knowledge.about.location}.`], actions: [action('About Anjana', 'about')], topic: 'about' };
    return fallback();
  }
  window.AnjanaPortfolio = Object.freeze({ knowledge, reply });
})();
