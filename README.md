# 🚀 NexMES Pro System
# NexMES는 React와 ASP.NET Core를 바탕으로, 현장의 수주부터 생산, 재고 관리까지 실시간으로 제어하는 제조 실행 시스템입니다.

## 🌐 http://nex-mes.com/

# 🛠 Tech Stack
### Frontend: React

### Backend: ASP.NET Core, Dapper (ORM)

### Database: MS SQL Server (MSSQL)

### Infra: Google Cloud Platform (GCP), Firebase (Auth)

### 📊1. 핵심 설계 및 로직
### 1️⃣ 데이터 정합성을 고려한 트랜잭션 설계
##### 차량 생산 시 **[생산 완료]**와 **[부품 재고 차감]**을 하나의 트랜잭션으로 설계했습니다. BOM(Bill of Materials) 정보를 기반으로 재고가 부족할 경우 생산 프로세스 진입이 불가능하도록 하여 데이터 정합성을 확보했습니다.

### 2️⃣ JOBID 기반의 추적성(Traceability) 강화
##### T_PRODUCTION_JOB의 JOBID를 T_STOCK_FINISHED와 T_STOCK_DEFECT의 외래키(FK)로 설정했습니다. 이는 PDA를 통한 모든 작업 이력을 특정 차량과 즉시 매칭하여, 불량 발생 시 원인 분석 및 추적을 용이하게 하기 위함입니다.

### 3️⃣ 사용자 인증 및 실시간 통계
##### Firebase를 통해 보안성 높은 로그인을 구현했으며, 실적 데이터를 기반으로 공정 수율 및 차량 생산 통계를 실시간으로 산출합니다.

### 📜2. API 명세서
##### <img src="https://github.com/user-attachments/assets/04b9d739-b83b-4b3d-aac9-cc34f6b1cdb8" width="100%">

### 📂3. 데이터베이스 ERD
##### <img src="https://github.com/user-attachments/assets/fe2473d9-4999-4dc2-9972-16bfa6079800" width="100%">

### 🖥️4. 시스템 화면
### 1. 생산 공정 대시보드
##### <img width="1920" height="1066" alt="image" src="https://github.com/user-attachments/assets/99074cff-daee-4e31-821c-20e3b72b6063" />

### 2. 재고 관리 및 수불 현황
##### <img src="https://github.com/user-attachments/assets/375bba36-3043-48b9-8e91-a647aa777682" width="100%">

### 3. 생산 실적 및 수율 분석
##### <img src="https://github.com/user-attachments/assets/c7f32c0f-0098-452b-91dc-3ac6e0322e41" width="100%">

### 5.전체 시스템 구조
##### <img width="2816" height="1536" alt="Gemini_Generated_Image_o273tpo273tpo273" src="https://github.com/user-attachments/assets/0272ff8d-aac7-45ea-8421-b246bb2b62db" />






