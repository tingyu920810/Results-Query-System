function doGet(e) {
  if (e.parameter.page === 'login') {
    return HtmlService.createHtmlOutputFromFile('login');
  }
  if (e.parameter.page === 'chart') {
    return HtmlService.createHtmlOutputFromFile('chart');
  }
  return HtmlService.createHtmlOutputFromFile('form');
}

function checkLogin(user) {
  const token = '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';
  const repo = 'tingyu920810/grade-database';
  const path = 'grades.json';
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  const response = UrlFetchApp.fetch(url, { headers });
  const content = JSON.parse(response.getContentText());
  const decoded = JSON.parse(
    Utilities.newBlob(Utilities.base64Decode(content.content)).getDataAsString()
  );

  const student = decoded.students.find(s => s.id === user.id && s.password === user.password);
  if (!student) return { success: false };

  return {
    success: true,
    grades: student.grades || []
  };
}

function analyzeByStudent(user, prompt) {
  const token = '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';
  const repo = 'tingyu920810/grade-database';
  const path = 'grades.json';
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  const response = UrlFetchApp.fetch(url, { headers });
  const content = JSON.parse(response.getContentText());
  const decoded = JSON.parse(
    Utilities.newBlob(Utilities.base64Decode(content.content)).getDataAsString()
  );

  const student = decoded.students.find(s => s.id === user.id && s.password === user.password);
  if (!student) throw new Error("登入資訊錯誤");

  return analyzeGrades(student, prompt);
}

function analyzeGrades(student, prompt) {
  const avg = student.grades.reduce((sum, g) => sum + g.score, 0) / student.grades.length;

  if (avg >= 90) return "表現優異，請繼續保持！";
  if (avg >= 75) return "中上表現，請加強錯誤題目的複習。";
  if (avg >= 60) return "需要穩定學習，建議訂定明確讀書計畫。";
  return "成績偏低，建議安排輔導課程並強化基本功。";
}

function submitGrade(data) {
  const token = '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';
  const repo = 'tingyu920810/grade-database';
  const path = 'grades.json';
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  const response = UrlFetchApp.fetch(url, { headers });
  const content = JSON.parse(response.getContentText());
  const decoded = JSON.parse(
    Utilities.newBlob(Utilities.base64Decode(content.content)).getDataAsString()
  );

  const students = decoded.students;
  let student = students.find(s => s.id === data.id);

  if (!student) {
    student = {
      id: data.id,
      name: data.name,
      password: "123456",
      grades: []
    };
    students.push(student);
  }

  student.grades.push({
    week: parseInt(data.week),
    score: parseFloat(data.score)
  });

  // 分析成績（使用內建邏輯）
  student.analysis = analyzeGrades(student, data.prompt);

  const updatePayload = {
    message: 'Update grade',
    content: Utilities.base64Encode(
      Utilities.newBlob(JSON.stringify(decoded, null, 2), 'application/json').getBytes()
    ),
    sha: content.sha
  };

  UrlFetchApp.fetch(url, {
    method: 'put',
    headers,
    payload: JSON.stringify(updatePayload)
  });
}
