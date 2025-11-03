"""
PDF 생성 기능 테스트

⚠️ CRITICAL: 이 테스트는 PDF 생성이 필수로 성공해야 합니다.
실패 시 인사이트 보고서 기능이 작동하지 않습니다.
"""
import asyncio
import logging
import base64

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def test_playwright():
    """Playwright PDF 생성 테스트"""
    try:
        logger.info("Playwright import 시도...")
        from playwright.async_api import async_playwright
        logger.info("✅ Playwright import 성공")
        
        logger.info("브라우저 실행 시도...")
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            logger.info("✅ 브라우저 실행 성공")
            
            page = await browser.new_page()
            logger.info("✅ 페이지 생성 성공")
            
            # 간단한 HTML 테스트
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Malgun Gothic', sans-serif; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>테스트 보고서</h1>
                <p>이것은 PDF 생성 테스트입니다.</p>
            </body>
            </html>
            """
            
            await page.set_content(html)
            logger.info("✅ HTML 콘텐츠 설정 성공")
            
            pdf_bytes = await page.pdf(
                format='A4',
                margin={'top': '25mm', 'right': '20mm', 'bottom': '25mm', 'left': '20mm'},
                print_background=True
            )
            logger.info(f"✅ PDF 생성 성공 (크기: {len(pdf_bytes)} bytes)")
            
            # PDF Base64 인코딩 검증
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            logger.info(f"✅ Base64 인코딩 성공 (길이: {len(pdf_base64)} chars)")
            
            # 필수 검증: PDF가 유효한지 확인
            if not pdf_base64 or len(pdf_base64) < 100:
                raise ValueError("PDF 생성 실패: 빈 데이터 또는 유효하지 않은 PDF")
            
            logger.info("✅ PDF 검증 성공")
            
            await browser.close()
            logger.info("✅ 브라우저 종료 성공")
            
            return True
            
    except ImportError as e:
        logger.error(f"❌ Playwright import 실패: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ PDF 생성 실패: {e}", exc_info=True)
        return False

if __name__ == "__main__":
    result = asyncio.run(test_playwright())
    if result:
        print("\n✅ PDF 생성 기능이 정상 작동합니다!")
    else:
        print("\n❌ PDF 생성 기능에 문제가 있습니다.")
