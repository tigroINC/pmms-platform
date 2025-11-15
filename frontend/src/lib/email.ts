import sgMail from '@sendgrid/mail';

// SendGrid API 키 설정
const isSendGridConfigured = !!process.env.SENDGRID_API_KEY;
if (isSendGridConfigured) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
}

// 발신자 정보
const emailFrom = process.env.EMAIL_FROM || 'no-reply@pmms.info';
const emailFromName = process.env.EMAIL_FROM_NAME || 'PMMS 환경측정관리시스템';

// 직원 초대 이메일 발송
export async function sendStaffInviteEmail(
  to: string,
  name: string,
  organizationName: string,
  role: string,
  inviteToken: string
) {
  // SendGrid 설정 확인
  if (!isSendGridConfigured) {
    console.warn('SendGrid API 키가 설정되지 않았습니다.');
    return { success: false, error: 'SendGrid 설정이 필요합니다.' };
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${inviteToken}`;
  
  const roleNames: Record<string, string> = {
    ORG_ADMIN: '조직 관리자',
    OPERATOR: '실무자',
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1f2937;
          margin: 0;
        }
        .content {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 500;
        }
        .info-box {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 직원 초대</h1>
        </div>
        
        <div class="content">
          <p><strong>${name}</strong>님, 안녕하세요!</p>
          
          <p><strong>${organizationName}</strong>에서 귀하를 <strong>${roleNames[role]}</strong> 역할로 초대했습니다.</p>
          
          <div class="info-box">
            <p><strong>초대 정보:</strong></p>
            <ul>
              <li>회사: ${organizationName}</li>
              <li>역할: ${roleNames[role]}</li>
              <li>이메일: ${to}</li>
            </ul>
          </div>
          
          <p>아래 버튼을 클릭하여 계정을 활성화하고 비밀번호를 설정해주세요.</p>
          
          <div style="text-align: center;">
            <a href="${inviteLink}" class="button">계정 활성화하기</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
          </p>
          
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
            ⚠️ 이 초대 링크는 24시간 동안 유효합니다.
          </p>
        </div>
        
        <div class="footer">
          <p>이 메일은 발신 전용입니다. 회신하지 마세요.</p>
          <p>&copy; ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      from: {
        email: emailFrom,
        name: emailFromName,
      },
      to,
      subject: `[${organizationName}] 직원 초대`,
      html: htmlContent,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

// 비밀번호 재설정 이메일 발송
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  // SendGrid 설정 확인
  if (!isSendGridConfigured) {
    console.warn('SendGrid API 키가 설정되지 않았습니다.');
    return { success: false, error: 'SendGrid 설정이 필요합니다.' };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 30px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
        }
        .content {
          background-color: white;
          border-radius: 6px;
          padding: 25px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .footer {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 비밀번호 재설정</h1>
        </div>
        
        <div class="content">
          <p><strong>${name}</strong>님, 안녕하세요.</p>
          
          <p>PMMS 환경측정관리시스템 비밀번호 재설정을 요청하셨습니다.</p>
          
          <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">비밀번호 재설정하기</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ 중요:</strong>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>이 링크는 <strong>1시간 동안만</strong> 유효합니다.</li>
              <li>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.</li>
              <li>링크를 클릭할 수 없다면 아래 URL을 복사하여 브라우저에 붙여넣으세요.</li>
            </ul>
          </div>
          
          <p style="font-size: 12px; color: #6b7280; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>
        
        <div class="footer">
          <p>이 이메일은 PMMS 환경측정관리시스템에서 자동으로 발송되었습니다.</p>
          <p>문의사항이 있으시면 시스템 관리자에게 연락해주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sgMail.send({
      from: {
        email: emailFrom,
        name: emailFromName,
      },
      to,
      subject: '[PMMS] 비밀번호 재설정 요청',
      html: htmlContent,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Password reset email send error:', error);
    return { success: false, error };
  }
}
