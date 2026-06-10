package com.festival.waiting.service;

import com.festival.waiting.domain.User;
import com.festival.waiting.repository.UserRepository;
import com.festival.waiting.repository.BoothRepository;
import com.festival.waiting.security.JwtTokenProvider;
import com.festival.waiting.domain.Booth;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BoothRepository boothRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // 서버 기동 시 최초 1회 기본 최상위 어드민 계정 자동 생성
        if (userRepository.findByUsername("admin").isEmpty()) {
            log.info("[초기 설정] 디폴트 시스템 어드민 계정 생성 시작");
            User admin = new User(
                    "admin",
                    passwordEncoder.encode("admin1234"),
                    "시스템 관리자",
                    "01000000000",
                    User.Role.ROLE_ADMIN,
                    true // 어드민은 가입 즉시 승인 상태
            );
            userRepository.save(admin);
            log.info("[초기 설정] 디폴트 시스템 어드민 계정(admin) 생성 완료");
        }
    }

    @Transactional
    public User registerUser(String username, String password, String name, String phoneNumber, User.Role role) {
        log.info("[회원 가입] ID: {}, 이름: {}, 역할: {}", username, name, role);
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + username);
        }

        // 가입 직후에는 관리자/주최자의 승인을 대기하도록 false로 생성합니다.
        boolean isApproved = false;
        User newUser = new User(
                username,
                passwordEncoder.encode(password),
                name,
                phoneNumber,
                role,
                isApproved
        );
        return userRepository.save(newUser);
    }

    @Transactional(readOnly = true)
    public String loginUser(String username, String password) {
        log.info("[로그인 요청] ID: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("아이디가 존재하지 않습니다: " + username));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        if (!user.isApproved()) {
            throw new IllegalArgumentException("아직 승인되지 않은 계정입니다. 관리자의 승인을 기다려 주세요.");
        }

        Long boothId = boothRepository.findByMerchantId(user.getId())
                .map(Booth::getId)
                .orElse(null);

        return jwtTokenProvider.createToken(user.getUsername(), user.getRole().name(), boothId);
    }

    /**
     * 손님 전용: 무가입 휴대폰 번호 인증 기반 JWT 발급
     */
    @Transactional
    public String getOrCreateCustomerToken(String phoneNumber, Long festivalId) {
        log.info("[손님 간편 토큰 발급] 전화번호: {}, 축제 ID: {}", phoneNumber, festivalId);
        
        // 휴대폰 번호로 가입된 유저가 없으면 자동 임시 생성
        User customer = userRepository.findByPhoneNumber(phoneNumber)
                .filter(u -> u.getRole() == User.Role.ROLE_CUSTOMER)
                .orElseGet(() -> {
                    log.info("[손님 최초 인증] 신규 임시 손님 객체 생성");
                    User newCustomer = new User(
                            "cust_" + System.currentTimeMillis() + "_" + phoneNumber,
                            passwordEncoder.encode("customer_pass"), // 더미 패스워드
                            "손님_" + phoneNumber.substring(Math.max(0, phoneNumber.length() - 4)),
                            phoneNumber,
                            User.Role.ROLE_CUSTOMER,
                            true // 손님은 가입 즉시 승인 상태
                    );
                    return userRepository.save(newCustomer);
                });

        return jwtTokenProvider.createCustomerToken(customer.getPhoneNumber(), customer.getRole().name(), festivalId);
    }

    @Transactional(readOnly = true)
    public List<User> getPendingOrganizers() {
        return userRepository.findByRoleAndIsApproved(User.Role.ROLE_ORGANIZER, false);
    }

    @Transactional
    public void approveOrganizer(Long organizerId) {
        log.info("[주최자 승인] ID: {}", organizerId);
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자 ID입니다: " + organizerId));

        if (organizer.getRole() != User.Role.ROLE_ORGANIZER) {
            throw new IllegalArgumentException("해당 사용자는 주최자(ORGANIZER)가 아닙니다.");
        }

        organizer.setApproved(true);
        userRepository.save(organizer);
    }

    @Transactional(readOnly = true)
    public List<User> getPendingMerchants() {
        return userRepository.findByRoleAndIsApproved(User.Role.ROLE_MERCHANT, false);
    }

    @Transactional
    public void approveMerchant(Long merchantId) {
        log.info("[상인 승인] ID: {}", merchantId);
        User merchant = userRepository.findById(merchantId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자 ID입니다: " + merchantId));

        if (merchant.getRole() != User.Role.ROLE_MERCHANT) {
            throw new IllegalArgumentException("해당 사용자는 상인(MERCHANT)이 아닙니다.");
        }

        merchant.setApproved(true);
        userRepository.save(merchant);
    }
}
