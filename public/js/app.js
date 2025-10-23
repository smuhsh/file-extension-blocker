// public/js/app.js
$(function() {
  const API = '/api/extensions'; // 백엔드 API 기본 경로

  /**
   * 간단 알림창 표시 함수
   * (현재는 alert() 사용 중, 추후 부트스트랩 토스트로 개선 가능)
   */
  function showAlert(msg, type='info') {
    alert(msg);
  }

  /**
   * 확장자 문자열 정규화 함수
   * - 공백 제거
   * - 소문자로 변환
   * - 맨 앞의 점(.) 제거
   */
  function normalizeExt(name) {
    if (!name) return '';
    name = name.trim().toLowerCase();
    if (name.startsWith('.')) name = name.slice(1);
    return name;
  }

  /**
   * [고정 확장자 목록] 불러오기
   * - 서버에서 /api/extensions/fixed 호출
   * - 각 항목을 체크박스 형태로 렌더링
   * - 체크 상태 변경 시 PUT 요청으로 DB 반영
   */
  function loadFixed() {
    $.get(`${API}/fixed`).done(function(data) {
      const container = $('#fixed-list').empty();
      if (!Array.isArray(data)) return;

      // 각 확장자를 리스트로 렌더링
      data.forEach(item => {
        const id = `fixed-${item.extId}`;
        const checked = item.IS_BLOCKED === 'Y' || item.isBlocked === 'Y';
        const html = `
          <div class="list-group-item d-flex align-items-center">
            <div class="form-check">
              <input class="form-check-input fixed-cb" type="checkbox"
                id="${id}" data-name="${item.extName}" ${checked ? 'checked' : ''}>
              <label class="form-check-label ms-2" for="${id}">.${item.extName}</label>
            </div>
          </div>`;
        container.append(html);
      });

      // 체크박스 변경 시 서버로 상태 업데이트 (PUT)
      $('.fixed-cb').off('change').on('change', function() {
        const name = $(this).data('name');
        const isBlocked = $(this).is(':checked') ? 'Y' : 'N';
        $.ajax({
          url: `${API}/fixed`,
          method: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({ extName: name, isBlocked }),
        }).fail(() => {
          showAlert('서버 저장 실패');
        });
      });
    });
  }

  /**
   * [커스텀 확장자 목록] 불러오기
   * - 서버에서 /api/extensions/custom 호출
   * - 각 항목을 목록(li) 형태로 렌더링
   * - 삭제 버튼 클릭 시 DELETE 요청 실행
   */
  function loadCustom() {
    $.get(`${API}/custom`).done(function(data) {
      const list = $('#custom-list').empty();
      if (!Array.isArray(data)) return;

      data.forEach(item => {
        const li = $(`
          <li class="list-group-item d-flex justify-content-between align-items-center">
            .${item.extName}
            <button class="btn btn-sm btn-outline-danger btn-del" data-id="${item.extId}">X</button>
          </li>
        `);

        // 삭제 버튼 클릭 이벤트
        li.find('.btn-del').click(function() {
          if (!confirm(`.${item.extName} 확장자를 삭제하시겠습니까?`)) return;
          $.ajax({
            url: `${API}/custom/${item.extId}`,
            method: 'DELETE'
          }).done(loadCustom).fail(() => showAlert('삭제 실패'));
        });

        list.append(li);
      });

      // 현재 등록된 커스텀 확장자 개수 표시
      $('#custom-count').text(data.length || 0);
    });
  }

  /**
   * [추가 버튼] 클릭 이벤트
   * - 입력값 검증
   * - 중복 여부 검사
   * - 서버에 POST 요청으로 확장자 추가
   */
  $('#add-btn').click(function() {
    const raw = $('#custom-input').val();
    const name = normalizeExt(raw);

    if (!name) return showAlert('확장자를 입력하세요.');
    if (name.length > 20) return showAlert('확장자 최대 길이는 20자입니다.');

    // 이미 고정 확장자 목록에 있는 경우 방지
    const fixedExists = $('.fixed-cb').toArray().some(cb => $(cb).data('name').toLowerCase() === name);
    if (fixedExists) return showAlert('이미 고정 확장자 목록에 존재합니다.');

    // 현재 커스텀 목록에서 중복 검사
    const duplicateLocal = $('#custom-list li').toArray().some(li => $(li).text().trim().startsWith('.' + name));
    if (duplicateLocal) return showAlert('이미 추가된 확장자입니다.');

    // 서버에 추가 요청 (POST)
    $.ajax({
      url: `${API}/custom`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ extName: name })
    }).done(() => {
      $('#custom-input').val(''); // 입력창 초기화
      loadCustom(); // 목록 다시 불러오기
    }).fail(xhr => {
      if (xhr.status === 409) showAlert('이미 존재하는 확장자입니다.');
      else if (xhr.responseJSON && xhr.responseJSON.error) showAlert(xhr.responseJSON.error);
      else showAlert('추가 실패');
    });
  });

  /**
   * 초기 실행: 페이지 로드 시 고정/커스텀 목록 불러오기
   */
  loadFixed();
  loadCustom();

  /**
   * Enter 키로도 확장자 추가 가능
   */
  $('#custom-input').on('keypress', function(e) {
    if (e.which === 13) {
      $('#add-btn').click();
    }
  });
});
